import { Buffer } from "buffer"
import * as fs from "fs"

import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi"
import * as handlebars from "handlebars"

import * as config from "./config"
import * as efs from "./efs"
import * as iam from "./iam"
import * as s3 from "./s3"
import * as vpc from "./vpc"

const workerEbsBlockDevices: aws.types.input.ec2.LaunchTemplateBlockDeviceMapping[] = [{
    deviceName: "/dev/sdf",
    ebs: {
        encrypted: "true",
        volumeSize: 300,
        volumeType: "gp2",
    },
}]

if (!config.workers.useInstanceStore) {
    workerEbsBlockDevices.push({
        deviceName: "/dev/sde",
        ebs: {
            encrypted: "true",
            volumeSize: 300,
            volumeType: "gp2",
        },
    })
}

const workersLaunchTemplate = new aws.ec2.LaunchTemplate("workers", {
    blockDeviceMappings: workerEbsBlockDevices,
    ebsOptimized: "true",
    iamInstanceProfile: {
        arn: iam.workerInstanceProfile.arn,
    },
    imageId: config.ami.worker[config.aws.region],
    instanceType: config.workers.instanceType,
    keyName: config.aws.keyPair,
    metadataOptions: {
        httpEndpoint: "enabled",
        httpPutResponseHopLimit: 2,
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
        const template = handlebars.compile(fs.readFileSync("ec2-init-worker.sh", "utf8"))
        return Buffer.from(template({
            configBucketName,
            capsuleCacheEfsId,
            datasetsEfsId,
            pulumiStackName,
        })).toString("base64")
    }),
    vpcSecurityGroupIds: [vpc.sgWorkers.id],
})

export const workersAsg = new aws.autoscaling.Group("workers", {
    name: pulumi.interpolate`${workersLaunchTemplate.name}-${workersLaunchTemplate.latestVersion}-asg`, // force a redeployment when launch template changes
    defaultCooldown: 120,
    enabledMetrics: ["GroupMinSize", "GroupMaxSize", "GroupDesiredCapacity", "GroupInServiceInstances", "GroupPendingInstances", "GroupStandbyInstances", "GroupTerminatingInstances", "GroupTotalInstances"],
    launchTemplate: {
        id: workersLaunchTemplate.id,
        version: pulumi.interpolate`${workersLaunchTemplate.latestVersion}`,
    },
    maxSize: config.workers.autoScalingMaxSize,
    minSize: config.workers.autoScalingMinSize,
    tags: [{
        key: "Name",
        propagateAtLaunch: true,
        value: "codeocean-worker",
    }, {
        key: "deployment",
        propagateAtLaunch: true,
        value: config.deploymentName,
    }, {
        key: "role",
        propagateAtLaunch: true,
        value: "worker",
    }],
    vpcZoneIdentifiers: vpc.vpc.privateSubnetIds,
})

export const workersAvailableSlotsScaleOutPolicy = new aws.autoscaling.Policy("workers-available-slots-scale-out", {
    adjustmentType: "ChangeInCapacity",
    autoscalingGroupName: workersAsg.name,
    estimatedInstanceWarmup: 60,
    policyType: "StepScaling",
    stepAdjustments: [{
        metricIntervalUpperBound: "0",
        scalingAdjustment: 1,
    }],
})

export const workersAvailableSlotsScaleInPolicy = new aws.autoscaling.Policy("workers-available-slots-scale-in", {
    adjustmentType: "ChangeInCapacity",
    autoscalingGroupName: workersAsg.name,
    estimatedInstanceWarmup: 60,
    policyType: "StepScaling",
    stepAdjustments: [{
        metricIntervalLowerBound: "0",
        scalingAdjustment: -1,
    }],
})
