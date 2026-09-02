import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:2567');

ws.on('open', () => {
  console.log('Conectado.');
  ws.send(JSON.stringify({ tipo: 'proponer', texto: 'Propongo que Engremiat use el mismo motor de dialogos del juego para responder tambien por Telegram.' }));
});

ws.on('message', (data) => {
  const m = JSON.parse(data.toString());
  if (m.tipo === 'bienvenida') console.log('BIENVENIDA: eres', m.acervo);
  else if (m.tipo === 'mensaje') console.log('\n[' + m.autor + (m.esIA ? ' (IA)' : '') + ']: ' + m.texto);
  else if (m.tipo === 'coste') console.log('(coste acumulado real: $' + m.costeTotalUsd.toFixed(6) + ')');
  else if (m.tipo === 'estado' && !m.deliberando) { console.log('\nFIN DE LA DELIBERACION.'); process.exit(0); }
});

setTimeout(() => { console.log('TIMEOUT'); process.exit(1); }, 60000);
