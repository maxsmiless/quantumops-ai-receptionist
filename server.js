import express from 'express';
import { WebSocketServer } from 'ws';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

// Start HTTP server
const server = app.listen(port, () => {
  console.log(`AI receptionist WebSocket server running on port ${port}`);
});

// WebSocket server
const wss = new WebSocketServer({ server, path: '/stream' });

wss.on('connection', (ws) => {
  console.log('Twilio stream connected');

  ws.on('message', async (message) => {
    const data = JSON.parse(message);

    if (data.event === 'media') {
      // Placeholder AI response for now
      const aiResponse = "Welcome to QuantumOps AI, how can I help you today?";

      // Convert text to speech with ElevenLabs
      const audioResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: aiResponse,
          voice_settings: { stability: 0.4, similarity_boost: 0.8 }
        })
      });

      const audioBuffer = await audioResponse.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');

      ws.send(JSON.stringify({
        event: 'media',
        media: { payload: audioBase64 }
      }));
    }
  });

  ws.on('close', () => console.log('Twilio stream closed'));
});
