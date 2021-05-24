# Configuration

| Name | <div style="width:250px">Description</div> | Required | Type | Default | Example |
|:-:|:-:|:-:|:-:|:-:|:-:|
| aws:region | AWS Region | `true` | `string` | - | us-east-1
| aws.keyPair | AWS EC2 key pair name | `true` | `string` | - | codeocean |
| domains.app | Code Ocean hosting domain | `true` |  `string` | - | codeocean.acmecorp.com |
| auth.allowedDomains | List of allowed sign in domains, comma separated | `false` | `string` | - | acmecorp.com |
| auth.builtin.reCaptchaApiKey | Support ReCAPTCHA challenge if builtin auth is enabled | `false` | `secret:string`| - | |
| auth.google.clientID | Google Sign In OAuth2 client ID | `false` | `string` | - | |
| auth.google.clientSecret | Google Sign In OAuth2 client secret | `false` | `secret:string` | - ||
| saml.entityID | SAML IdP Entity ID | `false` | `string` | - | |
| saml.ssoUrl | SAML IdP SSO URL | `false` | `string` | - | |
| saml.certificate | SAML IdP x.509 certificate | `false` | `string` | - | |
| auth.systemAPIKey | System API key  | `false` | `secret:string` | - | |
| aws.redis.enabled | Enable managed AWS ElastiCache Redis | `false` | `boolean` | `false` | |
| aws.redis.instanceType | AWS ElastiCache Redis instance type | `false` | `string` | `cache.t3.micro` | |
| aws.redis.multiAZ | Enable AWS ElastiCache Redis Multi-AZ | `false` | `boolean` | `false` | |
| aws.elasticsearch.enabled | Enable managed AWS Elasticsearch | `false` | `boolean` | `false` | |
| aws.elasticsearch.instanceType | AWS Elasticsearch instance type | `false` | `string` | `t3.small.elasticsearch` | |
| aws.elasticsearch.multiAZ | Enable AWS Elasticsearch Multi-AZ | `false` | `boolean` | `false` | |
| aws.analyticsdb.instanceClass | Analytics DB RDS instance class | `false` | `string` | `db.t3.micro` | |
| aws.analyticsdb.multiAZ | Enable Analytics DB Multi-AZ | `false` | `boolean` | `false` | |
| features.capsuleCache | Enable per-capsule cache (alpha) | `false` | `boolean` | `false` | |
| features.disablePackageSuggestions | Disable package suggestion in capsule environment editor | `false` | `boolean` | `false` | |
| features.enableIntercom | Enable Intercom support integration | `false` | `boolean` | `false` | |
| gitProviders.github.org | GitHub organization name | `false` | `string` | - | |
| segment.backend.apiKey | Backend Segment API key to send analytics to Code Ocean | `false` | `secret:string` | - | |
| segment.frontend.apiKey | Frontend Segment API key to send analytics to Code Ocean | `false` | `secret:string` | - | |
| vpc.cidrBlock | AWS VPC CIDR block | `false` | `string` | `10.0.0.0/16` | `pulumi config set --path vpc.cidrBlock 192.168.10.0/24` |
| vpc.ingressCidrBlocks | Security group ingress CIDR block | `false` | `string array` | `["0.0.0.0/0"]` | `pulumi config set --path vpc.ingressCidrBlocks[0] 192.168.10.11/32` |
| workers.autoScalingMaxSize | General workers auto scale group maximum size | `false` | `number` | 3 | |
| workers.autoScalingMinSize | General workers auto scale group minimum size | `false` | `number` | 0 | |
| workers.autoScalingIdleTimeout | General worker machine idle timeout in minutes to trigger worker scale in  | `false` | `number` | 60 | |
| workers.instanceType | General workers EC2 instance type | `false` | `string` | `r5d.4xlarge` | `r5d` family |
| workers.maintainIdleWorker | Maintain excess compute to serve computation immediately | `false` | `boolean` | `false` | |
| workers.useInstanceStore | The Code Ocean general workers can leverage instance store volumes for better performance, depending on worker instance type. | `false` | `boolean` | `true` | |
| workers.gpu.autoScalingMaxSize | GPU workers auto scale group maximum size | `false` | `number` | 3 | |
| workers.gpu.autoScalingMinSize | GPU workers auto scale group minimum size | `false` | `number` | 0 | |
| workers.gpu.autoScalingIdleTimeout | GPU worker machine idle timeout in minutes to trigger worker scale in  | `false` | `number` | 60 | |
| workers.gpu.instanceType | GPU workers EC2 instance type | `false` | `string` | `p2.xlarge` | `p` family |
| workers.gpu.maintainIdleWorker | Maintain excess GPU compute to serve computation immediately | `false` | `boolean` | `false` | |
| workers.gpu.useInstanceStore | The Code Ocean GPU workers can leverage instance store volumes for better performance, depending on worker instance type. | `false` | `boolean` | `false` | |
