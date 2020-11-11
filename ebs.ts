import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi"

import * as config from "./config"
import * as vpc from "./vpc"

// `/data` volume for all services (workspaces, couchdb, gitea, postgres, registry, ...)
export const dataVolume = new aws.ebs.Volume("data", {
    type: "gp2",
    size: 300,
    availabilityZone: pulumi.output(vpc.vpc.privateSubnets).apply(v => v[0].subnet.availabilityZone),
    encrypted: true,
    tags: {
        deployment: config.deploymentName,
    },
}, {
    ignoreChanges: ["size"],
    protect: true,
})
