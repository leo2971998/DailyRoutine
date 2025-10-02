# AWS Lambda Deployment Script for Daily Routine Alexa Skill
# Make sure you have AWS CLI configured with appropriate permissions

param(
    [string]$FunctionName = "daily-routine-alexa",
    [string]$Runtime = "python3.9",
    [string]$Handler = "handler.lambda_handler",
    [string]$RoleArn = "arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role"
)

Write-Host "🚀 Deploying Daily Routine Alexa Skill to AWS Lambda..." -ForegroundColor Green

# Check if AWS CLI is configured
try {
    aws sts get-caller-identity | Out-Null
} catch {
    Write-Host "❌ AWS CLI not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt -t .

# Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
Compress-Archive -Path "*.py", "ask_sdk_core*", "ask_sdk_model*", "ask_sdk_runtime*" -DestinationPath "alexa-skill.zip" -Force

# Check if function exists
try {
    aws lambda get-function --function-name $FunctionName | Out-Null
    Write-Host "🔄 Updating existing function..." -ForegroundColor Yellow
    aws lambda update-function-code --function-name $FunctionName --zip-file fileb://alexa-skill.zip
} catch {
    Write-Host "🆕 Creating new function..." -ForegroundColor Yellow
    aws lambda create-function --function-name $FunctionName --runtime $Runtime --role $RoleArn --handler $Handler --zip-file fileb://alexa-skill.zip --timeout 30 --memory-size 256
}

# Set environment variables
Write-Host "🔧 Setting environment variables..." -ForegroundColor Yellow
aws lambda update-function-configuration --function-name $FunctionName --environment Variables='{"API_BASE":"http://localhost:8000","FIXED_USER_ID":"68dcaa1e450fee4dd3d6b17b","HTTP_TIMEOUT":"6.0"}'

# Get function ARN
$FunctionArn = aws lambda get-function --function-name $FunctionName --query 'Configuration.FunctionArn' --output text

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "📋 Function ARN: $FunctionArn" -ForegroundColor Cyan
Write-Host "🔗 Use this ARN in your Alexa skill configuration" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy the Function ARN above"
Write-Host "2. Go to Amazon Developer Console"
Write-Host "3. Create/update your Alexa skill"
Write-Host "4. Set the endpoint to: $FunctionArn"
Write-Host "5. Test with: 'Alexa, open daily routine'"

# Cleanup
Remove-Item -Path "alexa-skill.zip" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "ask_sdk_core*", "ask_sdk_model*", "ask_sdk_runtime*", "boto3*", "botocore*", "urllib3*", "certifi*", "charset_normalizer*", "idna*", "requests*", "s3transfer*", "six*", "python_dateutil*", "jmespath*" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "🧹 Cleanup complete!" -ForegroundColor Green
