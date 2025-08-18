import express from 'express';
import { WebSocketServer } from 'ws';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import AWS from 'aws-sdk';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

// --- New: S3 presign endpoint ---
app.get("/presign", async (req, res) => {
  try {
    const fileKey = req.query.key;
    if (!fileKey) {
      return res.status(400).json({ error: "Missing 'key' parameter" });
    }

    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || "eu-west-2",
      signatureVersion: "v4"
    });

    const url = s3.getSignedUrl("getObject", {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey,
      Expires: 300 // 5 minutes
    });

    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate presigned URL" });
  }
});

// --- Start HTTP server ---
const server = app.listen(port, () => {
  console.log(`AI receptionist server running on port ${port}`);
});

// --- WebSocket server for Twilio ---
const wss = new WebSocketServer({ server, path: '/stream' });

wss.on('connection', (ws) => {
  console.log('Twilio stream connected');

  ws.on('message', async (message) => {
    const data = JSON.parse(message);

    if (data.event === 'media') {
      // Placeholder AI response
      const aiResponse = "Welcome to QuantumOps AI, how can I help you today?";

      // ElevenLabs request
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
