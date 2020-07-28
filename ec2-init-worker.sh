#! /bin/bash
set -x

#
# Init script for private cloud EC2 worker instance.
#

# Mount the docker EBS volume
echo "UUID=$(blkid -s UUID -o value /dev/nvme1n1)  /docker  xfs defaults 0 2" >> /etc/fstab
mount /docker

systemctl restart docker

# Mount the worker EBS volume
mkdir /worker
mkfs -t xfs /dev/nvme2n1
echo "UUID=$(blkid -s UUID -o value /dev/nvme2n1)  /worker  xfs defaults 0 2" >> /etc/fstab
mount /worker

# Mount EFS
{{#if capsuleCacheEfsId}}
mkdir /capsule-cache
echo "{{capsuleCacheEfsId}}:/ /capsule-cache efs _netdev,tls,iam 0 0" >> /etc/fstab
mount /capsule-cache
{{/if}}
mkdir /datasets
echo "{{datasetsEfsId}}:/ /datasets efs _netdev,tls,iam 0 0" >> /etc/fstab
mount /datasets

# Set the config bucket configuration
echo 'CONFIG_BUCKET="{{configBucketName}}"' >> /etc/default/codeocean
# Set the pulumi stack name
echo 'PULUMI_STACK_NAME="{{pulumiStackName}}"' >> /etc/default/codeocean

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
