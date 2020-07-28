import * as aws from "@pulumi/aws"

import * as config from "./config"
import * as vpc from "./vpc"

export let capsuleCache: aws.efs.FileSystem

if (config.features?.capsuleCache) {
    capsuleCache = new aws.efs.FileSystem("capsule-cache", {
        encrypted: true,
        tags: {
            Name: "codeocean-capsule-cache",
            deployment: config.deploymentName,
        },
    })
}

export const datasets = new aws.efs.FileSystem("datasets", {
    encrypted: true,
    tags: {
        Name: "codeocean-datasets",
        deployment: config.deploymentName,
    },
})

vpc.vpc.privateSubnets.then(subnets => {
    for (const subnet of subnets) {
        if (config.features?.capsuleCache) {
            new aws.efs.MountTarget(`capsule-cache-mount-target-${subnet.subnetName}`, {
                securityGroups: [vpc.sgEfs.id],
                fileSystemId: capsuleCache.id,
                subnetId: subnet.id,
            })
        }

        new aws.efs.MountTarget(`datasets-mount-target-${subnet.subnetName}`, {
            securityGroups: [vpc.sgEfs.id],
            fileSystemId: datasets.id,
            subnetId: subnet.id,
        })
    }
})
