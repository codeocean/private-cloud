import * as aws from "@pulumi/aws"

import * as config from "./config"
import * as vpc from "./vpc"

export const datasets = new aws.efs.FileSystem("datasets", {
    encrypted: true,
    tags: {
        Name: "codeocean-datasets",
        deployment: config.deploymentName,
    },
})

for (const subnet of vpc.vpc.privateSubnets) {
    new aws.efs.MountTarget(`datasets-mount-target-${subnet.subnetName}`, {
        securityGroups: [vpc.sgEfs.id],
        fileSystemId: datasets.id,
        subnetId: subnet.id,
    })
}
