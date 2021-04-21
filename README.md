# Code Ocean Private Cloud Deployment

## Deployment Prerequisites

1. An AWS account. Please contact our support to share the Code Ocean AMIs with this account.
1. Admin access to the AWS account to deploy.
1. AWS region. We currently support `us-east-1` and `eu-central-1`.
1. A choice of hosting domain.

    The deployment project will create a new AWS Route53 public hosted zone to host the Code Ocean deployment.
    This will be a `codeocean` subdomain of the parent domain, e.g. `codeocean.acmecorp.com`.
    During deployment you will need to configure the parent domain (e.g. `acmecorp.com`) to delegate the `codeocean` subdomain to Route53 by adding an NS record in the parent domain, so access to configure DNS on the parent domain is required.
1. Create an S3 bucket in your AWS account to store Pulumi infrastructure state, e.g. `s3://codeocean-[acmecorp]-pulumi-backend`.

    We recommend to create the S3 bucket with server side encryption, versioning and access logs enabled.
    You can read more about Pulumi backends [here](https://www.pulumi.com/docs/intro/concepts/state/).
1. Create an EC2 key pair (normally, `codeocean`). Store the private key to be able to SSH into EC2 machines.
1. Create AWS IAM service linked roles for RDS and Elasticsearch (if using managed ES):
    ```
    aws iam create-service-linked-role --aws-service-name rds.amazonaws.com
    aws iam create-service-linked-role --aws-service-name es.amazonaws.com
    ```
    Please note that the above commands might return an error if the roles already exist in the AWS account. This can be ignored.

## Pulumi Setup

**Note**: We recommend to set up an EC2 instance in your AWS account from which you will set up Pulumi and perform Code Ocean deployments.
We find that this gives the best experience with Pulumi.

1. Install Pulumi and Node.js. See instructions [here](./docs/pulumi.md).
1. Clone this repository:
    ```
    git clone https://github.com/codeocean/private-cloud.git && cd private-cloud
    ```
1. Install npm packages:
    ```
    npm ci
    ```
1. Login to your Pulumi S3 backend (make sure to replace the bucket name with the bucket you created):
    ```
    pulumi login --cloud-url s3://codeocean-[acmecorp]-pulumi-backend
    ```
1. Create a deployment stack:
    ```
    pulumi stack init
    ```

## Configuration

Configure required variables:
```
pulumi config set aws:region [region, e.g. `us-east-1`]
pulumi config set aws.keyPair [key pair name, see above]
pulumi config set domains.app [hosting domain, e.g. `codeocean.acmecorp.com`]
```

To configure Google OAuth2 client credentials:
```
pulumi config set auth.google.clientID
pulumi config set --secret auth.google.clientSecret
```

To configure SAML SSO:
```
pulumi config set --path auth.saml.domain
```
Then either configure the identity provider metadata URL:
```
pulumi config set --path auth.saml.metadataUrl
```
or metadata information:
```
pulumi config set --path auth.saml.metadata.entityID
pulumi config set --path auth.saml.metadata.ssoUrl
pulumi config set --path auth.saml.metadata.certificate < /path/to/cert
```

To configure GitHub organization support:
```
pulumi config set --path gitProviders.github.org [org name]
```

The following command make sure that all required plugins are installed, and if not installing them :
```
pulumi plugin install
```

## Deployment

```
pulumi up
```

You will be prompted to enter a passphrase to protect config/secrets.
Choose a meaningful password and store it safely. You will need it every time you deploy.

**Important**: The deployment provisions an SSL certificate that is validated with a DNS record.
It then waits until the certificate is validated by AWS.
Please make sure to complete the following DNS setup, otherwise the deployment cannot complete.

### Domain Setup

`pulumi up` will create a new Route53 public hosted zone (e.g. `codeocean.acmecorp.com`).
Use the NS DNS record in the new hosted zone to configure the parent domain (e.g. `acmecorp.com`) to delegate the subdomain to Route53.

1. In your AWS account console, go to Route53 Hosted Zones and find your new public hosted zone (e.g. codeocean.acmecorp.com) then select View Details.
1. Copy the value of the NS record. Here's an example of such NS record:
    ```
    Name = codeocean.acmecorp.com
    Type = NS
    Value =
    ns-1923.awsdns-48.co.uk.
    ns-366.awsdns-45.com.
    ns-1437.awsdns-51.org.
    ns-673.awsdns-20.net.
    ```
1. Add an NS record in your parent domain (e.g. `acmecorp.com`) with the copied value to delegate the subdomain to Route53.

**Note**: If you update an existing NS record in your parent domain, the new NS record could take time to propagate.
This could fail the provisioning of an SSL certificate that is part of the deployment, as it relies on DNS verification, and in turn, would fail the deployment.
Wait until the DNS change propagates and run the deployment again with `pulumi up`.

## Site administrator signup

Go to `https://codeocean.[acmecorp].com/join` to create an admin account.

## Base Image Deployment

1. Navigate to the Docker Image Deployment section in the Admin panel.
1. Fill in the image details. Examples:

    Python Miniconda3 base image:
    ```
    Name: Python
    Version: 3.8.1, miniconda 4.8.2, jupyterlab 2.1.1
    Source: codeocean/jupyterlab:2.1.1-miniconda4.8.2-python3.8-ubuntu18.04
    Language: Python
    Machine Type: Standard
    Description: Conda makes this environment a great starting point for installing other languages.
    Keywords: Python, JupyterLab, Ubuntu, 18.04
    ```
    R base image:
    ```
    Name: R
    Version: 3.6.3, RStudio 1.2.5019
    Source: codeocean/r-studio:1.2.5019-r3.6.3-ubuntu18.04
    Language: R
    Machine Type: Standard
    Description: R is a language and environment for statistical computing and graphics. RStudio is an integrated development environment for R.
    Keywords: R, RStudio, Ubuntu, 18.04
    ```
    Python Miniconda3 base image with GPU support:
    ```
    Name: Python with GPU support
    Version: 3.7.3, miniconda 4.7.10, CUDA 10.1
    Source: registry.codeocean.com/codeocean/miniconda3:4.7.10-cuda10.1-cudnn7-ubuntu18.04
    Language: Python
    Machine Type: GPU
    Description: Includes CUDA 10.1 and cuDNN 7 support. conda makes this a great starting point for installing deep learning frameworks and other languages (including Python 2.7).
    Keywords: Python, GPU, Ubuntu, 18.04
    ```    
1. Press Deploy.
