import * as fs from "fs"

import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi"
import * as handlebars from "handlebars"

import * as cloudwatch from "./cloudwatch"
import * as config from "./config"
import * as ebs from "./ebs"
import * as efs from "./efs"
import * as iam from "./iam"
import * as s3 from "./s3"
import * as vpc from "./vpc"

export const servicesInstance = new aws.ec2.Instance("services", {
    ami: config.ami.services[config.aws.region],
    ebsOptimized: true,
    ebsBlockDevices: [{
        deviceName: "/dev/sdf",
        encrypted: true,
        volumeSize: 100,
        volumeType: "gp2",
    }],
    iamInstanceProfile: iam.servicesInstanceProfile,
    instanceType: aws.ec2.InstanceTypes.M5_Large,
    keyName: config.aws.keyPair,
    metadataOptions: {
        httpEndpoint: "enabled",
        httpPutResponseHopLimit: 2,
    },
    subnetId: pulumi.output(vpc.vpc.privateSubnetIds).apply(subnets => subnets[0]),
    tags: {
        Name: "codeocean-services",
        deployment: config.deploymentName,
        role: "services",
    },
    userData: pulumi.all([
        s3.configBucket.bucket,
        efs.capsuleCache?.id,
        efs.datasets.id,
        config.stackname,
    ]).apply(([
        configBucketName,
        capsuleCacheEfsId,
        datasetsEfsId,
        pulumiStackName,
    ]) => {
        const template = handlebars.compile(fs.readFileSync("ec2-init-services.sh", "utf8"))
        return template({
            configBucketName,
            capsuleCacheEfsId,
            datasetsEfsId,
            pulumiStackName,
        })
    }),
    vpcSecurityGroupIds: [vpc.sgServices.id],
}, {
    dependsOn: [
        efs.capsuleCache,
        efs.datasets,
        s3.configBucket,
        cloudwatch.instancesLogGroup,
        cloudwatch.servicesLogGroup,
    ],
    // XXX Terraform & Pulumi have an issue with mixing ebsBlockDevices and VolumeAttachment which will
    // cause them to recreate the instance on each update, which we sadly do here. So we ignore
    // changes on ebsBlockDevices to workaround this, until they will hopefully fix this limitation
    // one day. You will need to force a replacment if you change ebsBlockDevices which you might
    // have to do even without this as Terraform & Pulumi seem to have an issue of not detecting
    // changes in ebsBLockDevices anyhow.
    //
    // https://www.pulumi.com/docs/reference/pkg/nodejs/pulumi/aws/ec2/#VolumeAttachment
    // https://www.pulumi.com/docs/reference/pkg/nodejs/pulumi/aws/ec2/#block-devices
    ignoreChanges: ["ebsBlockDevices"],
})

new aws.ec2.VolumeAttachment("services-data-volume", {
    instanceId: servicesInstance.id,
    volumeId: ebs.dataVolume.id,
    deviceName: "/dev/sde",
}, {
    deleteBeforeReplace: true,
})
