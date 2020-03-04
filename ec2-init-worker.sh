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

# Set the config bucket configuration
echo 'CONFIG_BUCKET="{{configBucketName}}"' >> /etc/default/codeocean

systemctl restart codeocean
