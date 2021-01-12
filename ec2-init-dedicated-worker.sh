#!/bin/bash
set -ex

#
# Init script for private cloud EC2 dedicated worker instance.
#

# Mount the docker EBS volume
echo "UUID=$(blkid -s UUID -o value /dev/sdf)  /docker  xfs defaults 0 2" >> /etc/fstab
mount /docker

systemctl restart docker

# Mount the worker EBS volume
mkdir /worker
mkfs -t xfs /dev/sdg
echo "UUID=$(blkid -s UUID -o value /dev/sdg)  /worker  xfs defaults 0 2" >> /etc/fstab
mount /worker

# Mount EFS
{{#if capsuleCacheEfsId}}
mkdir /capsule-cache
echo "{{capsuleCacheEfsId}}:/ /capsule-cache efs _netdev,tls,iam 0 0" >> /etc/fstab
until mount /capsule-cache; do sleep 1; done
{{/if}}
mkdir /datasets
echo "{{datasetsEfsId}}:/ /datasets efs _netdev,tls,iam 0 0" >> /etc/fstab
until mount /datasets; do sleep 1; done

# Set the config bucket configuration
echo 'CONFIG_BUCKET="{{configBucketName}}"' >> /etc/default/codeocean
# Set as dedicated worker
echo 'CO_DEDICATED_WORKER=true' >> /etc/default/codeocean
# Set the pulumi stack name
echo 'PULUMI_STACK_NAME="{{pulumiStackName}}"' >> /etc/default/codeocean

# Set Machine Type
TOKEN=`curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60"`
EC2_INSTANCE_ID=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" 169.254.169.254/latest/meta-data/instance-id)
EC2_AVAIL_ZONE=`curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/availability-zone`
EC2_REGION="`echo \"$EC2_AVAIL_ZONE\" | sed 's/[a-z]$//'`"
MACHINE_TYPE=`aws ec2 describe-tags --region $EC2_REGION --filters "Name=resource-id,Values=$EC2_INSTANCE_ID" | jq -r '.Tags[] | select(.Key=="codeocean.com/machine_type") | .Value'`
echo 'MACHINE_TYPE='$MACHINE_TYPE >> /etc/default/codeocean

systemctl restart codeocean

# Set cloudwatch logs agent conf
cat << EOF > /tmp/cloudwatch-logs-config.json
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/codeocean/{{pulumiStackName}}/instances"
                    }
                ]
            }
        },
        "log_stream_name": "workers/{instance_id}/{ip_address}"
    }
}
EOF

# Sending /var/log/messages to cloud watch logs
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a append-config -s -c file:/tmp/cloudwatch-logs-config.json
