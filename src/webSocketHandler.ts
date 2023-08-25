let dataBucket: any = [];

let aliveTime = 0;

function handleSession(websocket: WebSocket) {
	websocket.accept();

	websocket.addEventListener('message', async (event) => {
		try {
			const {} = event.data;
			console.log('event', event.data);
			dataBucket.push(event.data);
			websocket.send(JSON.stringify({ data: event.data, tz: new Date(), dataBucketLength: dataBucket.length }));
		} catch (error) {
			console.log(error);
			websocket.send(JSON.stringify({ error: 'Unknown message received', tz: new Date() }));
		}
	});

	websocket.addEventListener('close', async (evt) => {
		// Handle when a client closes the WebSocket connection
		console.log(evt);
	});

	setInterval(() => {
		aliveTime += 1;
		console.log('socket state', websocket.readyState, 'aliveTime', aliveTime);
	}, 1000);
}

export default function websocketHandler(request: Request) {
	const upgradeHeader = request.headers.get('Upgrade');
	if (upgradeHeader !== 'websocket') {
		return new Response('Expected websocket', { status: 400 });
	}

	const [client, server] = Object.values(new WebSocketPair());
	handleSession(server);

	return new Response(null, {
		status: 101,
		webSocket: client,
	});
}
