import * as aws from "@pulumi/aws"

import * as config from "./config"
import * as vpc from "./vpc"

// `/data` volume for all services (workspaces, couchdb, gitea, postgres, registry, ...)
export const dataVolume = new aws.ebs.Volume("data", {
    type: "gp2",
    size: 300,
    availabilityZone: vpc.vpc.privateSubnets[0].subnet.availabilityZone,
    encrypted: true,
    tags: {
        deployment: config.deploymentName,
    },
}, {
    protect: true,
})
