#! /bin/bash
set -x

#
# Init script for private cloud EC2 worker instance.
#

# Mount the docker EBS volume
echo "UUID=$(blkid -s UUID -o value /dev/sdf)  /docker  xfs defaults 0 2" >> /etc/fstab
mount /docker

systemctl restart docker

# Mount the worker EBS volume
mkdir /worker
mkfs -t xfs {{#if useInstanceStore}}/dev/nvme2n1{{else}}/dev/sde{{/if}}
echo "UUID=$(blkid -s UUID -o value {{#if useInstanceStore}}/dev/nvme2n1{{else}}/dev/sde{{/if}})  /worker  xfs defaults 0 2" >> /etc/fstab
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

# External EFS Shared Volume
{{#if sharedVolume}}
TOKEN=`curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60"`
EC2_AVAIL_ZONE=`curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/availability-zone`
EC2_REGION="`echo \"$EC2_AVAIL_ZONE\" | sed 's/[a-z]$//'`"
EC2_ZONE_ID=`aws ec2 describe-availability-zones --region $EC2_REGION | jq -r '.AvailabilityZones[] | select(.ZoneName == "'$EC2_AVAIL_ZONE'").ZoneId'`

{{#each sharedVolume.mountTargets}}
if [[ "$EC2_ZONE_ID" = "{{this.availabilityZoneId}}" ]]; then echo "{{this.mountTargetIP}} {{../sharedVolume.efsId}}.efs.$EC2_REGION.amazonaws.com" >> /etc/hosts; fi
{{/each}}

mkdir /shared
echo "{{sharedVolume.efsId}}.efs.$EC2_REGION.amazonaws.com:/ /shared efs _netdev,tls 0 0" >> /etc/fstab
until mount /shared; do sleep 1; done
chown -R 165536:165536 /shared
{{/if}}

# Set the config bucket configuration
echo 'CONFIG_BUCKET="{{configBucketName}}"' >> /etc/default/codeocean
# Set the pulumi stack name
echo 'PULUMI_STACK_NAME="{{pulumiStackName}}"' >> /etc/default/codeocean
# Set Machine Type
echo 'MACHINE_TYPE={{machineType}}' >> /etc/default/codeocean

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
