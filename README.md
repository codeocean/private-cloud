# Code Ocean Private Cloud Deployment

## Deployment Prerequisites

1. An AWS account. The Code Ocean Enterprise AMIs need to be shared with this account.
1. Admin access to the AWS account to deploy.
1. Choice of region.
1. A choice of hosting domain (normally, `codeocean.[acmecorp].com`).

## EC2 Key Pair

Create a key pair (normally, `codeocean`). Store the private key to be able to SSH into EC2 machines.

## Pulumi Setup

1. Install Pulumi cli: https://www.pulumi.com/docs/get-started/install/
1. Please make a choice of the pulumi backend you'll be working with to store infrastructure state:
https://www.pulumi.com/docs/intro/concepts/state/
1. Install Node.js v12, eg `brew install node@12`
1. Clone this repository: `git clone https://github.com/codeocean/private-cloud.git && cd private-cloud`
1. Install npm packages: `npm ci`
1. Login to pulumi with the backend of choice: `pulumi login [options]`
1. Create a deployment stack:
    ```
    pulumi stack init [acmecorp]
    ```

## Configuration

Configure required variables:
```
pulumi config set aws:region [region, eg `us-east-1`]
pulumi config set aws.keyPair [key pair name, see above]
pulumi config set auth.allowedDomains [allowed signup domain list, eg `acmecorp.com`]
pulumi config set domains.app [hosting domain, eg `codeocean.[acmecorp].com`]
```

The Code Ocean workers can leverage instance store volumes for better performance, depending on worker instance type. The default worker type supports instance store volume:
```
pulumi config set workers.useInstanceStore true
```

To configure Google OAuth2 client credentials:
```
pulumi config set auth.google.clientID
pulumi config set --secret auth.google.clientSecret
```

To configure SAML SSO:
```
pulumi config set auth.saml.domain
pulumi config set auth.saml.metadataUrl
```

To configure GitHub organization support:
```
pulumi config set --path gitProviders.github.org [org name]
```

## Deployment

```
pulumi up
```

## Domain Setup

Pulumi will create a new Route53 public hosted zone (eg `codeocean.[acmecorp].com`).
Use the NS DNS record in the new hosted zone to configure the parent domain (eg `[acmecorp].com`) to
delegate the subdomain to Route53.

Example:
```
Name = codeocean.[acmecorp].com
Type = NS
Value =
ns-1923.awsdns-48.co.uk.
ns-366.awsdns-45.com.
ns-1437.awsdns-51.org.
ns-673.awsdns-20.net.
```

If you update an existing NS record in your parent domain, the new NS record could take time to propagate.
This could fail the provisioning of an SSL certificate that is part of the deployment, as it relies on
DNS verification, and in turn, would fail the deployment.
Wait until the DNS change propogates and run the deployment again with `pulumi up`.

## System Initialization

1. Go to `https://codeocean.[acmecorp].com/join` to create an admin account.
1. In the admin panel, go to Initialize System Data on the left.
1. Click Select All.
1. Click Initialize System Data and wait for the `done` indication.

## Base Image Deployment

1. Navigate to the Docker Image Deployment section in the Admin panel.
1. Fill in the image details. For example, a Python Miniconda3 base image:
    ```
    Name: Python
    Version: 3.8.1, miniconda 4.8.2, jupyterlab 2.1.1
    Source: codeocean/jupyterlab:2.1.1-miniconda4.8.2-python3.8-ubuntu18.04
    Language: Python
    Machine Type: 0
    Description: Conda makes this environment a great starting point for installing other languages.
    Keywords: Python, JupyterLab, Ubuntu, 18.04
    ```
    Or, an R base image:
    ```
    Name: R
    Version: 3.6.1, RStudio 1.2.5019
    Source: codeocean/r-studio:1.2.5019-r3.6.1-ubuntu18.04
    Language: R
    Machine Type: 0
    Description: R is a language and environment for statistical computing and graphics. RStudio is an integrated development environment for R.
    Keywords: R, RStudio, Ubuntu, 18.04
    ```
1. Press Deploy.

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
