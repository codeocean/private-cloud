#! /bin/bash
set -x

#
# Init script for private cloud EC2 services instance.
#

# Mount the docker EBS volume
echo "UUID=$(blkid -s UUID -o value /dev/nvme1n1)  /docker  xfs defaults 0 2" >> /etc/fstab
mount /docker

systemctl restart docker

# Mount the data EBS volume
# First, wait for volume attachment
until lsblk /dev/nvme2n1 &>/dev/null; do sleep 1; done
mkdir /data
if file -s /dev/nvme2n1 | grep ": data"; then
    mkfs -t xfs /dev/nvme2n1;
fi
echo "UUID=$(blkid -s UUID -o value /dev/nvme2n1)  /data  xfs defaults 0 2" >> /etc/fstab
mount /data

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
        "log_stream_name": "services/{instance_id}/{ip_address}"
    }
}
EOF

# Sending /var/log/messages to cloud watch logs
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a append-config -s -c file:/tmp/cloudwatch-logs-config.json
