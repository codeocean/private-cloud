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
mkdir /datasets
echo "{{datasetsEfsId}}:/ /datasets efs _netdev,tls,iam 0 0" >> /etc/fstab
mount /datasets

# Set the config bucket configuration
echo 'CONFIG_BUCKET="{{configBucketName}}"' >> /etc/default/codeocean

systemctl restart codeocean
