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

# Set the config bucket configuration
echo 'CONFIG_BUCKET="{{configBucketName}}"' >> /etc/default/codeocean
# Set as dedicated worker
echo 'CO_DEDICATED_WORKER=true' >> /etc/default/codeocean

systemctl restart codeocean
