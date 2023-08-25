import { Router } from 'itty-router';

// now let's create a router (note the lack of "new")
const router = Router();

const defaultData = { todos: [] };

// const setCache = (key: string, data: string) => WEBRTC.put(key, data);
// const getCache = (key: string) => WEBRTC.get(key);

// GET collection index
router.get('/api/todos', () => {
	// const data = ('test');
	// console.log(data);
	return new Response('Todos Index!');
});

// GET item
router.get('/api/todos/:id', ({ params }) => new Response(`Todo #${params.id}`));

// POST to the collection (we'll use async here)
router.post('/api/todos', async (request) => {
	const content = await request.json();

	return new Response('Creating Todo: ' + JSON.stringify(content));
});

router.post('/api/room', async (request, env: Env) => {
	try {
		const body = await request.json();
		console.log('body', JSON.stringify(body));
		const { roomId, roomName, sessionDesc } = body;
		await env.WEBRTC.put(String(roomId), JSON.stringify({ roomId, roomName, sessionDesc }));
		return new Response(
			JSON.stringify({
				status: 200,
				message: `${roomName} created successfully!`,
			}),
			{
				headers: {
					'content-type': 'application/json;charset=UTF-8',
					'Access-Control-Allow-Origin': '*',
				},
			}
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				status: 400,
				message: error,
			})
		);
	}
});
router.get('/api/rooms', async (request, env: Env) => {
	try {
		const data = await env.WEBRTC.list();
		return new Response(JSON.stringify(data), {
			headers: {
				'content-type': 'application/json;charset=UTF-8',
				'Access-Control-Allow-Origin': '*',
			},
		});
	} catch (error) {
		return error;
	}
});

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default router;
