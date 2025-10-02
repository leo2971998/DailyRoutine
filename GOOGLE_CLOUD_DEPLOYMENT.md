# 🚀 Google Cloud Deployment Guide for Daily Routine

This guide covers deploying the Daily Routine API to Google Cloud for Alexa integration.

## Prerequisites

- Google Cloud Account with billing enabled
- Google Cloud SDK installed
- Docker installed
- Alexa Developer Account
- AWS Account (for Lambda function)

## Step 1: Deploy API to Google Cloud Run

### 1.1 Prepare Docker Image

Create `Dockerfile` in the `api` folder:
```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 1.2 Deploy to Cloud Run
```bash
# Build and push container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/daily-routine-api

# Deploy to Cloud Run
gcloud run deploy daily-routine-api \
  --image gcr.io/YOUR_PROJECT_ID/daily-routine-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8000 \
  --env-vars GEMINI_API_KEY=your-gemini-key,MONGO_URI=your-mongo-uri
```

## Step 2: AWS Lambda Setup

### 2.1 Configure AWS CLI
```bash
aws configure
```

### 2.2 Create IAM Role for Lambda
1. Go to AWS IAM Console
2. Create role for Lambda
3. Attach `AWSLambdaBasicExecutionRole` policy
4. Note the role ARN

### 2.3 Deploy Lambda Function
```bash
cd alexa/lambda
# Update deploy.sh with your role ARN
./deploy.sh
```

### 2.4 Set Environment Variables
Update Lambda environment variables:
- `API_BASE`: Your Google Cloud Run URL (e.g., `https://daily-routine-api-xxx.run.app`)
- `FIXED_USER_ID`: `68dcaa1e450fee4dd3d6b17b`
- `HTTP_TIMEOUT`: `6.0`

## Step 3: Alexa Skill Setup

### 3.1 Create Alexa Skill
1. Go to [Amazon Developer Console](https://developer.amazon.com/alexa/console/ask)
2. Create new skill
3. Use "Custom" model
4. Set "Provision your own" hosting

### 3.2 Configure Interaction Model
1. Go to "Interaction Model" → "JSON Editor"
2. Use content from `alexa/interaction-model/en-US.json`
3. Save

### 3.3 Set Endpoint
1. Go to "Endpoint"
2. Select "AWS Lambda ARN"
3. Paste your Lambda Function ARN
4. Save

### 3.4 Test
1. Build model
2. Enable testing
3. Test commands like "open daily routine"

## Step 4: Database Setup

### Option A: MongoDB Atlas (Recommended)
1. Create MongoDB Atlas account
2. Create cluster
3. Get connection string
4. Update `MONGO_URI` in Cloud Run environment variables

### Option B: Cloud SQL
1. Create Cloud SQL instance
2. Install MongoDB on the instance
3. Configure for Cloud Run

## Step 5: Environment Variables

### Google Cloud Run
- `MONGO_URI`: Your MongoDB connection string
- `GEMINI_API_KEY`: Your Gemini API key
- `DATABASE_NAME`: `dailyroutine`

### AWS Lambda
- `API_BASE`: Your Cloud Run URL
- `FIXED_USER_ID`: `68dcaa1e450fee4dd3d6b17b`
- `HTTP_TIMEOUT`: `6.0`

## Step 6: Testing

### 6.1 Test API Directly
```bash
curl https://your-cloud-run-url.run.app/v1/health/live
```

### 6.2 Test Alexa Commands
- "Alexa, open daily routine"
- "add task review project proposal"
- "daily briefing"

## Step 7: Monitoring

### Google Cloud
- Cloud Run metrics and logs
- Error reporting
- Application insights

### AWS Lambda
- CloudWatch logs
- Lambda metrics
- Error tracking

## Production Considerations

### Security
- Use Service Account authentication
- Secure environment variables
- Enable HTTPS only
- Configure CORS properly

### Scaling
- Cloud Run auto-scales based on traffic
- Configure Cloud Run limits
- Set up monitoring alerts

### Cost Optimization
- Use Cloud Run pricing tiers
- Configure Lambda concurrency limits
- Monitor usage with billing alerts

## Troubleshooting

### Common Issues

**Cloud Run deployment fails:**
```bash
# Check logs
gcloud logs read --project=YOUR_PROJECT_ID

# Verify container builds
gcloud builds list --project=YOUR_PROJECT_ID
```

**Lambda can't reach Cloud Run:**
- Check Cloud Run is deployed with `--allow-unauthenticated`
- Verify `API_BASE` environment variable
- Test API endpoint manually

**Alexa skill not responding:**
- Check Lambda logs in CloudWatch
- Verify endpoint configuration
- Test Lambda function directly

## Files Structure

```
api/
├── Dockerfile
├── requirements.txt
├── main.py
└── ...

alexa/
├── lambda/
│   ├── handler.py
│   ├── requirements.txt
│   └── deploy.sh
└── interaction-model/
    └── en-US.json
```

## Next Steps

1. Deploy API to Google Cloud Run
2. Deploy Lambda function
3. Create Alexa skill
4. Test with real Alexa device
5. Set up monitoring and alerts

Happy deploying! ☁️🎤
