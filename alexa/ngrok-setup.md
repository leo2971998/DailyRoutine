# Ngrok Setup for Local API Testing

## Install Ngrok

### Windows
1. Download from https://ngrok.com/download
2. Extract to a folder (e.g., `C:\ngrok\`)
3. Add to PATH or use full path

### Alternative: Using Chocolatey
```powershell
choco install ngrok
```

## Setup Steps

1. **Start your API server:**
   ```powershell
   cd api
   python -m uvicorn main:app --reload --port 8000
   ```

2. **In another terminal, start ngrok:**
   ```powershell
   ngrok http 8000
   ```

3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

4. **Update Lambda environment variables:**
   - Go to AWS Lambda console
   - Find your `daily-routine-alexa` function
   - Update `API_BASE` to your ngrok URL
   - Save

5. **Test your Alexa skill** - it will now connect to your local API through ngrok

## Notes

- **Free ngrok URLs change every time** you restart ngrok
- **For development**, you'll need to update the Lambda environment variable each time
- **For production**, use a stable domain or deploy your API to AWS

## Example ngrok output:
```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok.io -> http://localhost:8000
```

Use the `https://abc123.ngrok.io` URL as your `API_BASE` in Lambda.
