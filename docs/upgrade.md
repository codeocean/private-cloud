# Upgrading Code Ocean

1. Make sure you have Pulumi CLI and NodeJS installed as described [here](https://github.com/codeocean/private-cloud#pulumi-setup).
1. Clone the deployment project repo:
    ```
    git clone https://github.com/codeocean/private-cloud
    cd private-cloud
    ```
    If you already have a clone, update it:
    ```
    cd private-cloud
    git pull
    ```
1. If you would like to deploy an earlier version, rather than the latest version, please `git checkout` the corresponding tag:
    ```
    git checkout X.Y.Z
    ```
1. Install npm packages:
    ```
    npm ci
    ```
1. Login to your Pulumi backend:
    ```
    pulumi login --cloud-url s3://[codeocean-pulumi-backend]
    ```
1. Prepare the Pulumi passphrase:
    ```
    read -s PULUMI_CONFIG_PASSPHRASE
    export PULUMI_CONFIG_PASSPHRASE
    ```
1. Select the Pulumi stack:
    ```
    pulumi stack select [stack-name]
    ```
1. Make sure you have the latest deployment configuration:
    ```
    pulumi config refresh -f
    ```
1. Stop all running computations

    SSH into the Code Ocean services machine:
    ```
    ssh ec2-user@`pulumi stack output ec2ServicesInstanceId`
    ```
    Run the following command:
    ```
    curl -v -X POST localhost:8300/cancel_computations
    ```
    Wait until all computations complete by waiting until the following CloudWatch metric
    reaches 0: `CloudWatch > Metrics > CodeOcean > AutoScalingGroupName > SlotsUtilization`.
1. Remove scale-in protection from Code Ocean worker EC2 instances:

    The upgrade waits for existing running workers to terminate before continuing. If you
    verified that there are no running computations in the previous step, you can safely
    remove the scale in protection from the workers in the auto scaling group to complete the upgrade quicker.

    In the AWS EC2 console go to `EC2 > Auto Scaling Groups > workers-[id]-asg > Instance
    Management`, then select all instances and click `Actions > Remove scale-in protection`
1. Deploy:
    ```
    pulumi up
    ```
