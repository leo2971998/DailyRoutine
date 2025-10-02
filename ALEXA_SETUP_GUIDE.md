# 🎤 Alexa Integration Setup Guide

This guide will help you set up the Daily Routine Alexa skill for testing with a real Alexa device.

## Prerequisites

- AWS Account with Lambda access
- Amazon Developer Account
- Alexa device or Alexa app
- Python 3.9+
- AWS CLI installed and configured

## Step 1: AWS Lambda Setup

### 1.1 Configure AWS CLI
```powershell
aws configure
```
Enter your AWS Access Key ID, Secret Access Key, and region.

### 1.2 Create IAM Role for Lambda
1. Go to AWS IAM Console
2. Create a new role for Lambda
3. Attach the `AWSLambdaBasicExecutionRole` policy
4. Note the role ARN (e.g., `arn:aws:iam::123456789012:role/lambda-execution-role`)

### 1.3 Deploy Lambda Function
```powershell
cd alexa/lambda
# Update the RoleArn in deploy.ps1 with your actual role ARN
.\deploy.ps1
```

This will:
- Install dependencies
- Create/update the Lambda function
- Set environment variables
- Return the Function ARN

## Step 2: Local API Setup

### 2.1 Start Your API Server
```powershell
cd api
python -m uvicorn main:app --reload --port 8000
```

### 2.2 Install and Start Ngrok
```powershell
# Install ngrok (if not already installed)
# Download from https://ngrok.com/download

# Start ngrok
ngrok http 8000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### 2.3 Update Lambda Environment Variables
1. Go to AWS Lambda Console
2. Find your `daily-routine-alexa` function
3. Go to Configuration → Environment variables
4. Update `API_BASE` to your ngrok URL
5. Save

## Step 3: Alexa Skill Setup

### 3.1 Create Alexa Skill
1. Go to [Amazon Developer Console](https://developer.amazon.com/alexa/console/ask)
2. Click "Create Skill"
3. Choose "Custom" model
4. Use "Provision your own" for hosting
5. Name: "Daily Routine"
6. Default language: English (US)

### 3.2 Configure Interaction Model
1. Go to "Interaction Model" → "JSON Editor"
2. Copy the content from `alexa/interaction-model/en-US.json`
3. Paste and save

### 3.3 Set Endpoint
1. Go to "Endpoint"
2. Select "AWS Lambda ARN"
3. Paste your Lambda Function ARN from Step 1.3
4. Select your region
5. Save

### 3.4 Build and Test
1. Click "Build Model"
2. Wait for build to complete
3. Go to "Test" tab
4. Enable testing for your skill

## Step 4: Test with Alexa

### 4.1 Test in Developer Console
Try these commands in the test simulator:
- "open daily routine"
- "add task review project proposal"
- "list my tasks"
- "daily briefing"

### 4.2 Test with Real Device
1. Make sure your Alexa device is signed in to the same Amazon account
2. Say: "Alexa, open daily routine"
3. Try the voice commands

## Step 5: Troubleshooting

### Common Issues

**Lambda function not responding:**
- Check CloudWatch logs
- Verify environment variables
- Ensure API server is running

**Alexa says "skill not found":**
- Make sure skill is published to your account
- Check if skill is enabled in Alexa app

**API connection errors:**
- Verify ngrok URL is correct
- Check if API server is accessible
- Look at Lambda logs for HTTP errors

### Debug Commands
```powershell
# Check Lambda logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/daily-routine-alexa

# Test API directly
curl https://your-ngrok-url.ngrok.io/v1/health/live
```

## Step 6: Production Deployment

For production use:

1. **Deploy API to AWS:**
   - Use AWS App Runner, ECS, or EC2
   - Set up proper domain and SSL

2. **Update Lambda environment:**
   - Change `API_BASE` to production URL
   - Remove ngrok dependency

3. **Publish Alexa Skill:**
   - Complete skill certification
   - Submit for public availability

## Supported Commands

- **Tasks:**
  - "add task [description]"
  - "complete task [name]"
  - "list my tasks"

- **Habits:**
  - "log habit [name]"
  - "check habit streak"

- **Schedule:**
  - "add event [description]"
  - "what's my schedule"

- **Summary:**
  - "daily briefing"
  - "how am I doing"

## Environment Variables

Required in Lambda:
- `API_BASE`: Your API URL (ngrok for development)
- `FIXED_USER_ID`: User ID to use for testing
- `HTTP_TIMEOUT`: Request timeout in seconds

## Files Created

- `alexa/lambda/requirements.txt` - Python dependencies
- `alexa/lambda/deploy.ps1` - Windows deployment script
- `alexa/skill-config.json` - Alexa skill configuration
- `alexa/ngrok-setup.md` - Ngrok setup instructions
- `ALEXA_SETUP_GUIDE.md` - This guide

## Next Steps

1. Follow this guide step by step
2. Test with the provided commands
3. Customize the interaction model as needed
4. Deploy to production when ready

Happy voice commanding! 🎤✨
