import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',

    supabase: {
        url: process.env.SUPABASE_URL!,
        serviceKey: process.env.SUPABASE_SERVICE_KEY!,
    },

    aiml: {
        apiKey: process.env.AIML_API_KEY!,
        baseUrl: 'https://api.aimlapi.com/v1',
    },

    baileys: {
        sessionDir: process.env.BAILEYS_SESSION_DIR || './auth_info_baileys',
    },
};

// Validate required env vars
const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'AIML_API_KEY',
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}
