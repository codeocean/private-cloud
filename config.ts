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
    }
    saml?: {
        domain: string,
        metadataUrl: string,
    }
}

interface AWSConfig {
    accountId?: string,  // injected during runtime
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

interface ServicesConfig {
    registryHost: string,
}

interface WorkerConfig {
    autoScalingMaxSize: number,
    autoScalingMinSize: number,
    instanceType: string,
    useInstanceStore?: boolean,
}

interface FeaturesConfig {
    disableDedicatedMachines: boolean,
    onboarding: string | undefined,
    useRInstallPackages: boolean,
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

export const domains: DomainConfig = {
    app: config.require("domains.app"),
    cloudWorkstation: config.get("domains.cloudWorkstation") || config.require("domains.app"),
    files: config.get("domains.files") || config.require("domains.app"),
    git: config.get("domains.git") || config.require("domains.app"),
}

export const services: ServicesConfig = {
    registryHost: deployment.singleInstance ? "localhost:5000" : `registry.${config.require("domains.app")}`,
}

export const auth: AuthConfig = {
    builtin: {
        reCaptchaApiKey: config.getSecret("auth.builtin.reCaptchaApiKey"),
    },
    google: {
        clientID: config.get("auth.google.clientID"),
        clientSecret: config.getSecret("auth.google.clientSecret"),
    }
}

if (config.get("auth.allowedDomains")) {
    auth.allowedDomains = config.require("auth.allowedDomains").split(',').map(x => x.trim())
}

if (config.get("auth.saml.domain")) {
    auth.saml = {
        domain: config.require("auth.saml.domain"),
        metadataUrl: config.require("auth.saml.metadataUrl"),
    }
}

export const workers: WorkerConfig = {
    autoScalingMaxSize: config.getNumber("workers.autoScalingMaxSize") || 3,
    autoScalingMinSize: config.getNumber("workers.autoScalingMinSize") || 1,
    instanceType: config.get("workers.instanceType") || "r5d.4xlarge",
    useInstanceStore: config.getBoolean("workers.useInstanceStore"),
}

export const features: FeaturesConfig = {
    disableDedicatedMachines: config.getBoolean("features.disableDedicatedMachines") === true,
    onboarding: config.get("features.onboarding"),
    useRInstallPackages: config.getBoolean("features.useRInstallPackages") === true,
}

export const ami: AMIConfig = {
    services: {
        "us-east-1": config.get("services.ami") || "ami-003b2e289fd9a903f",
        "eu-central-1": config.get("services.ami") || "ami-0ca59262581285fe0",
    },
    worker: {
        "us-east-1": config.get("workers.ami") || "ami-0ca0badbbee48646a",
        "eu-central-1": config.get("workers.ami") || "ami-0c34e59060793f421",
    },
}

export const elbAccountId: ElbAccountIdConfig = {
    "us-east-1": "127311923021",
    "eu-central-1": "054676820928",
}
