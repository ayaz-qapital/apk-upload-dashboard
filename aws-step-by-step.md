# AWS Setup - Step by Step Guide

## Prerequisites
1. AWS Account (sign up at aws.amazon.com)
2. Credit card for verification (Free Tier won't charge you)

---

## Step 1: Create S3 Bucket

### 1.1 Login to AWS Console
1. Go to [AWS Console](https://aws.amazon.com/console/)
2. Sign in with your AWS account

### 1.2 Navigate to S3
1. In the AWS Console search bar, type "S3"
2. Click on "S3" service

### 1.3 Create Bucket
1. Click **"Create bucket"** button
2. **Bucket name**: `apk-upload-dashboard-yourname123` (must be globally unique)
3. **Region**: Select `US East (N. Virginia) us-east-1`
4. **Block Public Access**: Keep all boxes CHECKED (for security)
5. **Bucket Versioning**: Disable
6. **Tags**: Skip (optional)
7. **Default encryption**: Keep default
8. Click **"Create bucket"**

### 1.4 Configure Bucket for Application Access
1. Click on your newly created bucket
2. Go to **"Permissions"** tab
3. Scroll to **"Bucket policy"**
4. Click **"Edit"**
5. Paste this policy (replace YOUR_ACCOUNT_ID and YOUR_IAM_USER):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/apk-dashboard-user"
            },
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::apk-upload-dashboard-yourname123/*"
        }
    ]
}
```

---

## Step 2: Create IAM User

### 2.1 Navigate to IAM
1. In AWS Console search bar, type "IAM"
2. Click on "IAM" service

### 2.2 Create User
1. Click **"Users"** in left sidebar
2. Click **"Create user"** button
3. **User name**: `apk-dashboard-user`
4. **Access type**: Check "Programmatic access"
5. Click **"Next: Permissions"**

### 2.3 Set Permissions
1. Click **"Attach existing policies directly"**
2. Search for "S3"
3. Check the box for **"AmazonS3FullAccess"**
4. Click **"Next: Tags"** (skip tags)
5. Click **"Next: Review"**
6. Click **"Create user"**

### 2.4 Save Credentials
**IMPORTANT**: Save these credentials immediately!
```
Access Key ID: AKIA... (copy this)
Secret Access Key: ... (copy this)
```
Download the CSV file or copy to notepad.

### 2.5 Get Your Account ID
1. Click on your username in top-right corner
2. Your Account ID is the 12-digit number
3. Copy this number for the bucket policy

---

## Step 3: Launch EC2 Instance

### 3.1 Navigate to EC2
1. In AWS Console search bar, type "EC2"
2. Click on "EC2" service

### 3.2 Launch Instance
1. Click **"Launch instance"** button
2. **Name**: `apk-dashboard-server`

### 3.3 Choose AMI
1. Select **"Amazon Linux 2023 AMI"** (should be first option)
2. Ensure it says "Free tier eligible"

### 3.4 Choose Instance Type
1. Select **"t2.micro"** (Free tier eligible)
2. Should show "1 vCPU, 1 GiB Memory"

### 3.5 Key Pair
1. Click **"Create new key pair"**
2. **Key pair name**: `apk-dashboard-key`
3. **Key pair type**: RSA
4. **Private key format**: .pem
5. Click **"Create key pair"**
6. **Save the .pem file** - you'll need it to connect!

### 3.6 Network Settings
1. Click **"Edit"** next to Network settings
2. **Auto-assign public IP**: Enable
3. **Create security group**: Select this option
4. **Security group name**: `apk-dashboard-sg`
5. Add these rules:

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|---------|-------------|
| SSH | TCP | 22 | My IP | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Web access |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Secure web |
| Custom TCP | TCP | 3001 | 0.0.0.0/0 | App server |

### 3.7 Storage
1. Keep default **8 GiB gp3** (Free tier)

### 3.8 Launch
1. Review all settings
2. Click **"Launch instance"**
3. Wait for instance to be "Running"

### 3.9 Get Instance Details
1. Click on your instance
2. Copy the **Public IPv4 address** (e.g., 3.15.123.456)

---

## Step 4: Connect to EC2

### 4.1 Using Windows (Command Prompt/PowerShell)
```bash
# Navigate to where you saved the .pem file
cd Downloads

# Set correct permissions (if using WSL/Git Bash)
chmod 400 apk-dashboard-key.pem

# Connect to instance
ssh -i apk-dashboard-key.pem ec2-user@YOUR_PUBLIC_IP
```

### 4.2 Using Windows (PuTTY)
1. Download PuTTY and PuTTYgen
2. Use PuTTYgen to convert .pem to .ppk
3. Use PuTTY to connect with the .ppk file

---

## Step 5: Verify Setup

### 5.1 Check S3 Bucket
- Bucket created: ✅
- Bucket policy configured: ✅
- Bucket name noted: ✅

### 5.2 Check IAM User
- User created: ✅
- Access keys saved: ✅
- S3 permissions attached: ✅

### 5.3 Check EC2 Instance
- Instance running: ✅
- Security group configured: ✅
- Key pair saved: ✅
- Can SSH connect: ✅

---

## Next Steps

Once all three components are set up:
1. Follow the deployment guide in `aws-setup.md`
2. Install Node.js and dependencies on EC2
3. Configure environment variables
4. Deploy your application

## Troubleshooting

**Can't connect to EC2?**
- Check security group allows SSH (port 22)
- Verify you're using correct .pem file
- Ensure instance is in "running" state

**S3 access denied?**
- Verify IAM user has S3FullAccess policy
- Check bucket policy has correct ARN
- Ensure access keys are correct

**Free Tier Limits**
- EC2: 750 hours/month (1 instance running 24/7)
- S3: 5GB storage, 20,000 GET requests
- Data Transfer: 15GB outbound/month
