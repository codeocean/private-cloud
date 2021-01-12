import * as aws from "@pulumi/aws"
import * as awsx from "@pulumi/awsx"
import * as pulumi from "@pulumi/pulumi"

import * as config from "./config"


export const vpc = new awsx.ec2.Vpc("vpc", {
    cidrBlock: config.vpc?.cidrBlock,
    numberOfAvailabilityZones: 2,
    tags: {
        deployment: config.deploymentName,
    },
})

export const sgExternal = new aws.ec2.SecurityGroup("external", {
    vpcId: vpc.id,
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
    }],
    ingress: [{
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        cidrBlocks: config.vpc?.ingressCidrBlocks || ["0.0.0.0/0"],
        ipv6CidrBlocks: config.vpc?.ingressCidrBlocks ? undefined : ["::/0"],
    }, {
        protocol: "tcp",
        fromPort: 443,
        toPort: 443,
        cidrBlocks: config.vpc?.ingressCidrBlocks || ["0.0.0.0/0"],
        ipv6CidrBlocks: config.vpc?.ingressCidrBlocks ? undefined : ["::/0"],
    }],
    tags: {
        deployment: config.deploymentName,
    },
})

export const sgServices = new aws.ec2.SecurityGroup("services", {
    vpcId: vpc.id,
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
    }],
    ingress: [{
        protocol: "tcp",
        fromPort: 3050,
        toPort: 3050,
        securityGroups: [sgExternal.id],
        description: "git-proxy",
    }, {
        protocol: "tcp",
        fromPort: 0,
        toPort: 7090,
        securityGroups: [sgExternal.id],
        description: "s3-proxy",
    }, {
        protocol: "tcp",
        fromPort: 8001,
        toPort: 8001,
        securityGroups: [sgExternal.id],
        description: "web",
    }, {
        protocol: "tcp",
        fromPort: 8080,
        toPort: 8080,
        securityGroups: [sgExternal.id],
        description: "gw",
    }, {
        protocol: "tcp",
        fromPort: 8114,
        toPort: 8114,
        securityGroups: [sgExternal.id],
        description: "cw-proxy",
    }, {
        protocol: "tcp",
        fromPort: 8504,
        toPort: 8504,
        securityGroups: [sgExternal.id],
        description: "file-proxy",
    }, {
        protocol: "tcp",
        fromPort: 0,
        toPort: 65535,
        self: true,
        description: "self",
    }],
    tags: {
        deployment: config.deploymentName,
    },
})

export const sgWorkers = new aws.ec2.SecurityGroup("workers", {
    vpcId: vpc.id,
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
    }],
    ingress: [{
        protocol: "tcp",
        fromPort: 8200,
        toPort: 8200,
        securityGroups: [sgServices.id],
        description: "services to worker proxies",
    }, {
        protocol: "tcp",
        fromPort: 10000,
        toPort: 65535,
        securityGroups: [sgServices.id],
        description: "services to worker runners/computations",
    }],
    tags: {
        deployment: config.deploymentName,
    },
})

export const sgEfs = new aws.ec2.SecurityGroup("efs", {
    vpcId: vpc.id,
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
    }],
    ingress: [{
        protocol: "tcp",
        fromPort: 2049,
        toPort: 2049,
        securityGroups: [sgServices.id],
        description: "efs from services",
    }, {
        protocol: "tcp",
        fromPort: 2049,
        toPort: 2049,
        securityGroups: [sgWorkers.id],
        description: "efs from workers",
    }],
    tags: {
        deployment: config.deploymentName,
    },
})

export let sgRedis : aws.ec2.SecurityGroup | undefined

if (config.services.aws.redis.enabled) {
    sgRedis = new aws.ec2.SecurityGroup("redis", {
        vpcId: vpc.id,
        ingress: [{
            protocol: "tcp",
            fromPort: 6379,
            toPort: 6379,
            securityGroups: [
                sgServices.id,
                sgWorkers.id,
            ],
            description: "Access to redis service from services machine and workers",
        }],
    })
} else {
    new aws.ec2.SecurityGroupRule("redis-from-workers", {
        type: "ingress",
        protocol: "tcp",
        fromPort: 6379,
        toPort: 6379,
        securityGroupId: sgServices.id,
        sourceSecurityGroupId: sgWorkers.id,
        description: "redis from workers",
    })
}

export let sgElasticsearch : aws.ec2.SecurityGroup | undefined

if (config.services.aws.elasticsearch.enabled) {
    sgElasticsearch = new aws.ec2.SecurityGroup("elasticsearch", {
        vpcId: vpc.id,
        ingress: [{
            protocol: "tcp",
            fromPort: 9200,
            toPort: 9200,
            securityGroups: [
                sgServices.id,
            ],
            description: "Access to elasticsearch domain from services machine",
        },
        {
            protocol: "tcp",
            fromPort: 443,
            toPort: 443,
            securityGroups: [
                sgServices.id,
            ],
            description: "Access to elasticsearch domain from services machine",
        }],
    })
}

new aws.ec2.SecurityGroupRule("wapi-from-workers", {
    type: "ingress",
    protocol: "tcp",
    fromPort: 8201,
    toPort: 8201,
    securityGroupId: sgServices.id,
    sourceSecurityGroupId: sgWorkers.id,
    description: "wapi from workers",
})

new aws.ec2.SecurityGroupRule("flexlm-from-workers", {
    type: "ingress",
    protocol: "tcp",
    fromPort: 27000,
    toPort: 27002,
    securityGroupId: sgServices.id,
    sourceSecurityGroupId: sgWorkers.id,
    description: "flexlm from workers",
})

new aws.ec2.SecurityGroupRule("registry-from-workers", {
    type: "ingress",
    protocol: "tcp",
    fromPort: 443,
    toPort: 443,
    securityGroupId: sgServices.id,
    sourceSecurityGroupId: sgWorkers.id,
    description: "registry from workers",
})

new aws.ec2.SecurityGroupRule("wdt-from-workers", {
    type: "ingress",
    protocol: "tcp",
    fromPort: 20000,
    toPort: 30000,
    securityGroupId: sgServices.id,
    sourceSecurityGroupId: sgWorkers.id,
    description: "wdt from workers",
})

new aws.ec2.VpcEndpoint("s3", {
    serviceName: `com.amazonaws.${config.aws.region}.s3`,
    vpcId: vpc.id,
    routeTableIds: pulumi.output(vpc.privateSubnets).apply(subnets => subnets.map((s) => s.routeTable!.id)),
    tags: {
        deployment: config.deploymentName,
    },
})
