import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi"

import * as config from "./config"
import * as secrets from "./secrets"
import * as vpc from "./vpc"

export let replicationGroup: aws.elasticache.ReplicationGroup | undefined

if (config.services.aws.redis.enabled) {
    let subnetGroup = new aws.elasticache.SubnetGroup("redis", {
        description: "Subnet group for Code Ocean Redis",
        subnetIds: vpc.vpc.privateSubnetIds,
    })
    
    replicationGroup = new aws.elasticache.ReplicationGroup("codeocean", {
        engine: "redis",	
        engineVersion: "5.0.6",
        nodeType: config.services.aws.redis.instanceType,	
        numberCacheClusters: config.services.aws.redis.multiAZ ? 2 : 1,	
        port: 6379,	
        automaticFailoverEnabled: config.services.aws.redis.multiAZ,	
        securityGroupIds: [vpc.sgRedis!.id],	
        subnetGroupName: subnetGroup.name,	
        replicationGroupDescription: "Code Ocean Redis",
        atRestEncryptionEnabled: true,
        transitEncryptionEnabled: true,
        availabilityZones: pulumi.output(vpc.vpc.privateSubnets).apply(v => {
            if (config.services.aws.redis.multiAZ) {
                return v.map((subnet) => subnet.subnet.availabilityZone)
            } else {
                return [v[0].subnet.availabilityZone]
            }
        }),
        authToken: secrets.redis.passsword.result,
        tags: {
            deployment: config.deploymentName,
        },
    })
}
