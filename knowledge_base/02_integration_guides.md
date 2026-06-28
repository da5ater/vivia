# Vivia Integration Guides

Welcome to the Vivia Integration Hub! This document provides accurate, step-by-step instructions on how to connect your favorite platforms and AI tools to Vivia. Follow these guides to get your intelligent agent up and running in minutes.

---

## 🎙️ 1. VAPI Integration (Voice AI)

VAPI provides powerful voice AI capabilities. To connect VAPI to Vivia, you need to configure your VAPI account and link it to our dashboard using an API Key.

### Step 1: Sign Up / Sign In to VAPI
1. Navigate to the [VAPI Dashboard](https://dashboard.vapi.ai/).
2. Click **Sign In** (or **Sign Up** if you don't have an account).
3. Complete the authentication process using your email or Google account.

### Step 2: Add and Configure Your AI Model
1. Once logged into the VAPI dashboard, navigate to the **Assistants** or **Models** tab on the left sidebar.
2. Click on **+ Create Assistant** or **Add Model**.
3. Choose the foundational model you want to use (e.g., GPT-4, Claude).
4. Configure the system prompt (instructions) to dictate how your voice agent should behave. Include specific instructions on pacing and tone.
5. Save your assistant configuration.

### Step 3: Generate Your API Key
1. On the VAPI dashboard, look for the **Settings** gear icon (usually at the bottom left).
2. Click on **Settings**, then navigate to the **API Keys** tab.
3. Click on **+ Generate New API Key**.
4. Give your key a recognizable name (e.g., `Vivia_Integration_Key`).
5. **Copy the generated API Key.** *(Keep this secure; you will not be able to see it again!)*

### Step 4: Paste to Vivia
1. Open your **Vivia Dashboard**.
2. Navigate to **Integrations** > **Voice (VAPI)**.
3. Paste the copied VAPI Key into the designated **API Key** field.
4. Click **Connect & Verify**. Your Vivia agent is now voice-ready!

**Troubleshooting VAPI:**
- *Audio Delay:* If you experience latency, check your VAPI model settings and switch to a lower-latency model optimized for voice.
- *API Key Error:* Ensure there are no leading or trailing spaces when pasting the key into Vivia.

---

## 📱 2. WhatsApp Integration

Connect Vivia to your WhatsApp Business account to handle customer chats automatically.

### Step 1: Prepare Your WhatsApp Business Account
1. Ensure you have the **WhatsApp Business App** installed or are registered with the WhatsApp Business API.
2. Go to the [Meta for Developers](https://developers.facebook.com/) portal and log in.

### Step 2: Create a Meta App
1. Click on **My Apps** -> **Create App**.
2. Select **Other** > **Next** > **Business**.
3. Fill in your app name (e.g., `Vivia_WA`) and connect it to your Business Manager account.

### Step 3: Configure WhatsApp Webhooks
1. In your new Meta App, add the **WhatsApp** product.
2. Go to **WhatsApp** -> **Configuration**.
3. Click **Edit** under Webhooks.
4. Paste the **Webhook URL** provided in your Vivia Dashboard.
5. Enter the **Verify Token** (also found in your Vivia Dashboard) and click **Verify and Save**.
6. Subscribe to the `messages` webhook field.

### Step 4: Link to Vivia
1. Copy your **Permanent Access Token** and **Phone Number ID** from the Meta dashboard.
2. Paste them into the **WhatsApp Integration** section of your Vivia Dashboard.
3. Click **Connect**. Send a test message to your WhatsApp number to verify!

**Troubleshooting WhatsApp:**
- *Messages not sending:* Ensure your Meta App is live and that you have added payment methods in your WhatsApp Business Manager if you have exceeded the free tier of Meta's messaging limits.

---

## 💬 3. Facebook Messenger Integration

Allow Vivia to automatically reply to messages on your Facebook Business Page.

### Step 1: Link Your Facebook Page
1. Log into your **Vivia Dashboard**.
2. Go to **Integrations** > **Facebook Messenger**.
3. Click on **Connect with Facebook**.
4. A popup will appear asking you to log into your Facebook account. 
5. Select the Business Page(s) you want Vivia to manage.
6. Grant the necessary permissions (Manage Pages, Send Messages).

### Step 2: Configure Page Settings
1. Once linked, return to the Vivia Dashboard.
2. Toggle the switch to **Enable Agent on Messenger**.
3. Optionally, set up a **Greeting Message** or **Get Started button** payload within Vivia to guide users when they first open a chat with your page.

### Step 3: Test the Integration
1. Open Facebook Messenger using a personal account.
2. Search for your Business Page and send a message.
3. Vivia should reply instantly based on your AI configurations!

**Troubleshooting Messenger:**
- *No Response:* Go to your Facebook Page Settings > Advanced Messaging. Ensure that your connected Vivia app is set as the Primary Receiver for the handover protocol.
