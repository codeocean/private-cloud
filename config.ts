import * as pulumi from "@pulumi/pulumi"

// Latest released Code Ocean Enterprise AMIs per region
interface AMIConfig {
    services: {
        [region: string]: string,
    },
    worker: {
        [region: string]: string,
    }
}

interface SAMLIdPConfig {
    domain: string,
    metadataUrl?: string,
    metadata?: {
        entityID: string,
        ssoUrl: string,
        certificate: string,
    }
}

interface AuthConfig {
    allowedDomains?: string[],
    builtin: {
        reCaptchaApiKey?: pulumi.Output<string>,
    },
    google: {
        clientID?: string,
        clientSecret?: pulumi.Output<string>,
    },
    saml?: SAMLIdPConfig,
    systemAPIKey?: pulumi.Output<string>,
}

interface AWSConfig {
    accountId?: string, // injected during runtime
    keyPair: string,
    region: string,
}

interface DeploymentConfig {
    singleInstance: boolean,
}

interface DomainConfig {
    app: string,
    cloudWorkstation: string,
    files: string,
    git: string,
}

// Elastic Load Balancing Account ID per region
// Used in ELB access log configuration
interface ElbAccountIdConfig {
    [region: string]: string,
}

interface FeaturesConfig {
    capsuleCache: boolean,
    disablePackageSuggestions: boolean,
    enableIntercom: boolean,
    onboarding: string,
    useRInstallPackages: boolean,
}

interface GitProvidersConfig {
    github: {
        org: string,
    },
}

interface RedisConfig {
    enabled?: boolean,
    instanceType?: string,
    multiAZ?: boolean
}

interface ServicesConfig {
    registryHost: string,
    aws: {
        redis: RedisConfig
    },
    segment: {
        backend: {
            apiKey?: pulumi.Output<string>,
        },
        frontend: {
            apiKey?: pulumi.Output<string>,
        },
    }
}

interface VpcConfig {
    cidrBlock: string,
    ingressCidrBlocks: string[],
}

interface WorkerConfig {
    autoScalingMaxSize: number,
    autoScalingMinSize: number,
    autoScalingIdleTimeout: number,
    instanceType: string,
    maintainIdleWorker: boolean,
    useInstanceStore?: boolean,
}

/**
 * Config extends `pulumi.Config` with extra functionality.
 */
class Config extends pulumi.Config {
    /**
     * getObjectWithDefaults extends `pulumi.Config.getObject` to assign default values
     * to the loaded config object.
     *
     * @param key The key to lookup.
     * @param defaults The default values.
     */
    getObjectWithDefaults<T>(key: string, defaults: T): T {
        const o = this.getObject<T>(key)
        return Object.assign(defaults, o)
    }
}

const config = new Config()
const awsConfig = new pulumi.Config("aws")
export const project = pulumi.getProject()
export const stackname = pulumi.getStack()
export const deploymentName = `codeocean-${project}-${stackname}`

export const deployment: DeploymentConfig = {
    singleInstance: config.getBoolean("singleInstance") === true,
}

export const aws: AWSConfig = {
    keyPair: config.require("aws.keyPair"),
    region: awsConfig.require("region"),
}

export const vpc = config.getObject<VpcConfig>("vpc")

export const domains: DomainConfig = {
    app: config.require("domains.app"),
    cloudWorkstation: config.get("domains.cloudWorkstation") || config.require("domains.app"),
    files: config.get("domains.files") || config.require("domains.app"),
    git: config.get("domains.git") || config.require("domains.app"),
}

export const gitProviders = config.getObject<GitProvidersConfig>("gitProviders")

export const services: ServicesConfig = {
    registryHost: deployment.singleInstance ? "localhost:5000" : `registry.${config.require("domains.app")}`,
    aws: {
        redis: config.getObjectWithDefaults<RedisConfig>("aws.redis", {
            instanceType: "cache.t3.micro",
        }),
    },
    segment: {
        backend: {
            apiKey: config.getSecret("segment.backend.apiKey"),
        },
        frontend: {
            apiKey: config.getSecret("segment.frontend.apiKey"),
        },
    },
}

export const auth: AuthConfig = {
    builtin: {
        reCaptchaApiKey: config.getSecret("auth.builtin.reCaptchaApiKey"),
    },
    google: {
        clientID: config.get("auth.google.clientID"),
        clientSecret: config.getSecret("auth.google.clientSecret"),
    },
    saml: config.getObject("auth.saml"),
    systemAPIKey: config.getSecret("auth.systemAPIKey"),
}

if (config.get("auth.allowedDomains")) {
    auth.allowedDomains = config.require("auth.allowedDomains").split(",").map((x) => x.trim())
}

export const workers: WorkerConfig = {
    autoScalingMaxSize: config.getNumber("workers.autoScalingMaxSize") || 3,
    autoScalingMinSize: config.getNumber("workers.autoScalingMinSize") || 0,
    autoScalingIdleTimeout: config.getNumber("workers.autoScalingIdleTimeout") || 60,
    instanceType: config.get("workers.instanceType", { pattern: RegExp(/^r5d\..*$/) } ) || "r5d.4xlarge",
    maintainIdleWorker: config.getBoolean("workers.maintainIdleWorker") || false,
    useInstanceStore: config.getBoolean("workers.useInstanceStore"),
}

export const features = config.getObject<FeaturesConfig>("features")

export const ami: AMIConfig = {
    services: {
        "us-east-1": config.get("services.ami") || "ami-004863b83de262710",
        "eu-central-1": config.get("services.ami") || "ami-0e9b30df5f78f15e0",
    },
    worker: {
        "us-east-1": config.get("workers.ami") || "ami-096aa408a0a112f0c",
        "eu-central-1": config.get("workers.ami") || "ami-0f37377a58be539ef",
    },
}

export const elbAccountId: ElbAccountIdConfig = {
    "us-east-1": "127311923021",
    "eu-central-1": "054676820928",
}
