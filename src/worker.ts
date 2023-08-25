/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import handleProxy from './proxy';
import handleRedirect from './redirect';
import apiRouter from './router';
import template from './template';
import websocketHandler from './webSocketHandler';

const optionsHandler = (request: Request) => {
	const headers = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': '*',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Max-Age': '86400',
	};
	return new Response(null, {
		headers: headers,
	});
};

async function handleErrors(request: Request, handler: Function) {
	try {
		return await handler();
	} catch (err) {
		if (request.headers.get('Upgrade') == 'websocket') {
			// Annoyingly, if we return an HTTP error in response to a WebSocket request, Chrome devtools
			// won't show us the response body! So... let's send a WebSocket response with an error
			// frame instead.
			let pair = new WebSocketPair();
			pair[1].accept();
			if (err instanceof Error) {
				pair[1].send(JSON.stringify({ error: err.stack }));
			} else {
				pair[1].send(JSON.stringify({ error: err }));
			}
			pair[1].close(1011, 'Uncaught exception during session setup');
			return new Response(null, { status: 101, webSocket: pair[0] });
		} else {
			if (err instanceof Error) {
				return new Response(err.stack, { status: 500 });
			} else {
				return new Response(JSON.stringify({ error: err }), { status: 500 });
			}
		}
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		try {
			// let id = env.EXAMPLE_CLASS.idFromName(new URL(request.url).pathname);
			if (request.method === 'OPTIONS') {
				return optionsHandler(request);
			}
			const url = new URL(request.url);
			switch (url.pathname) {
				case '/':
					return template();
				case '/api':
					return apiRouter.handle(request, env, ctx);
				case '/redirect':
					return handleRedirect.fetch(request, env, ctx);
				case '/proxy':
					return handleProxy.fetch(request, env, ctx);
				case '/ws':
					return websocketHandler(request);
				default:
					return new Response('Not found', { status: 404 });
			}
		} catch (err) {
			return err instanceof Error ? new Response(err.toString()) : new Response(JSON.stringify(err));
		}
	},
};

// export class DurableObjectExample {
// 	constructor(state, env) {}
// 	async fetch(request) {
// 		return new Response('Hello World');
// 	}
// }
