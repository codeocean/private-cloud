# Troubleshooting Issues

## SSH into EC2 instances

First, enable SSH connections through AWS Session Manager:
https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-getting-started-enable-ssh-connections.html

Second, make sure the private key from your EC2 key pair is available.

To SSH into the services machine:
```
ssh ec2-user@`pulumi stack output ec2ServicesInstanceId`
```

To SSH into one of the worker machines, list the machines:
```
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[LaunchTime,InstanceId,State.Name,PrivateIpAddress,Tags[?Key==`role`] | [0].Value][]' --output table
```

Then use the instance ID to SSH:
```
ssh ec2-user@[instance-id]
```
