#!/bin/bash

# AWS Lambda Deployment Script for Daily Routine Alexa Skill
# Make sure you have AWS CLI configured with appropriate permissions

set -e

FUNCTION_NAME="daily-routine-alexa"
RUNTIME="python3.9"
HANDLER="handler.lambda_handler"
ROLE_ARN="arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role"

echo "🚀 Deploying Daily Routine Alexa Skill to AWS Lambda..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt -t .

# Create deployment package
echo "📦 Creating deployment package..."
zip -r alexa-skill.zip . -x "*.pyc" "__pycache__/*" "*.git*" "deploy.sh" "local_test.py" "fixtures/*"

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME > /dev/null 2>&1; then
    echo "🔄 Updating existing function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://alexa-skill.zip
else
    echo "🆕 Creating new function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --zip-file fileb://alexa-skill.zip \
        --timeout 30 \
        --memory-size 256
fi

# Set environment variables
echo "🔧 Setting environment variables..."
aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --environment Variables='{
        "API_BASE":"http://localhost:8000",
        "FIXED_USER_ID":"68dcaa1e450fee4dd3d6b17b",
        "HTTP_TIMEOUT":"6.0"
    }'

# Get function ARN
FUNCTION_ARN=$(aws lambda get-function --function-name $FUNCTION_NAME --query 'Configuration.FunctionArn' --output text)

echo "✅ Deployment complete!"
echo "📋 Function ARN: $FUNCTION_ARN"
echo "🔗 Use this ARN in your Alexa skill configuration"
echo ""
echo "Next steps:"
echo "1. Copy the Function ARN above"
echo "2. Go to Amazon Developer Console"
echo "3. Create/update your Alexa skill"
echo "4. Set the endpoint to: $FUNCTION_ARN"
echo "5. Test with: 'Alexa, open daily routine'"

# Cleanup
rm -f alexa-skill.zip
rm -rf ask_sdk_core* ask_sdk_model* ask_sdk_runtime* boto3* botocore* urllib3* certifi* charset_normalizer* idna* requests* s3transfer* six* python_dateutil* jmespath*

echo "🧹 Cleanup complete!"
