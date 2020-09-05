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

interface AuthConfig {
    allowedDomains?: string[],
    builtin: {
        reCaptchaApiKey?: pulumi.Output<string>,
    },
    google: {
        clientID?: string,
        clientSecret?: pulumi.Output<string>,
    },
    saml?: {
        domain: string,
        metadataUrl: string,
    },
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
    onboarding: string,
    useRInstallPackages: boolean,
}

interface GitProvidersConfig {
    github: {
        org: string,
    },
}

interface ServicesConfig {
    registryHost: string,
    segment: {
        backend: {
            apiKey: string | undefined,
        },
        frontend: {
            apiKey: string | undefined,
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
    reservedMemory: number,
    slotConfig: {
        cpu: number,
        memory: number,
    },
    useInstanceStore?: boolean,
}

const config = new pulumi.Config()
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
    segment: {
        backend: {
            apiKey: config.get("segment.backend.apiKey"),
        },
        frontend: {
            apiKey: config.get("segment.frontend.apiKey"),
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
    systemAPIKey: config.getSecret("auth.systemAPIKey"),
}

if (config.get("auth.allowedDomains")) {
    auth.allowedDomains = config.require("auth.allowedDomains").split(",").map((x) => x.trim())
}

if (config.get("auth.saml.domain")) {
    auth.saml = {
        domain: config.require("auth.saml.domain"),
        metadataUrl: config.require("auth.saml.metadataUrl"),
    }
}

export const workers: WorkerConfig = {
    autoScalingMaxSize: config.getNumber("workers.autoScalingMaxSize") || 3,
    autoScalingMinSize: config.getNumber("workers.autoScalingMinSize") || 0,
    autoScalingIdleTimeout: config.getNumber("workers.autoScalingIdleTimeout") || 5,
    instanceType: config.get("workers.instanceType") || "r5d.4xlarge",
    maintainIdleWorker: config.getBoolean("workers.maintainIdleWorker") || false,
    reservedMemory: config.getNumber("workers.reservedMemory") || 1073741824,
    slotConfig: {
        cpu: config.getNumber("workers.slotConfig.cpu") || 1.0,
        memory: config.getNumber("workers.slotConfig.memory") || 8129604096,
    },
    useInstanceStore: config.getBoolean("workers.useInstanceStore"),
}

export const features = config.getObject<FeaturesConfig>("features")

export const ami: AMIConfig = {
    services: {
        "us-east-1": config.get("services.ami") || "ami-06bddc346d4f8a069",
        "eu-central-1": config.get("services.ami") || "ami-04abe8596d8d01331",
    },
    worker: {
        "us-east-1": config.get("workers.ami") || "ami-0c50a8320c2468921",
        "eu-central-1": config.get("workers.ami") || "ami-0d485021b96e5487d",
    },
}

export const elbAccountId: ElbAccountIdConfig = {
    "us-east-1": "127311923021",
    "eu-central-1": "054676820928",
}
