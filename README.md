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
1. Install Node.js v14, eg `brew install node@14`
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
    Machine Type: 0
    Description: Conda makes this environment a great starting point for installing other languages.
    Keywords: Python, JupyterLab, Ubuntu, 18.04
    ```
    R base image:
    ```
    Name: R
    Version: 3.6.3, RStudio 1.2.5019
    Source: codeocean/r-studio:1.2.5019-r3.6.3-ubuntu18.04
    Language: R
    Machine Type: 0
    Description: R is a language and environment for statistical computing and graphics. RStudio is an integrated development environment for R.
    Keywords: R, RStudio, Ubuntu, 18.04
    ```
    Python Miniconda3 base image with GPU support:
    ```
    Name: Python with GPU support
    Version: 3.7.3, miniconda 4.7.10, CUDA 10.1
    Source: registry.codeocean.com/codeocean/miniconda3:4.7.10-cuda10.1-cudnn7-ubuntu18.04
    Language: Python
    Machine Type: 1
    Description: Includes CUDA 10.1 and cuDNN 7 support. conda makes this a great starting point for installing deep learning frameworks and other languages (including Python 2.7).
    Keywords: Python, GPU, Ubuntu, 18.04
    ```    
1. Press Deploy.
