import * as fs from "fs"

import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi"
import * as handlebars from "handlebars"

import * as config from "./config"
import * as efs from "./efs"
import * as iam from "./iam"
import * as s3 from "./s3"
import * as vpc from "./vpc"

const workerEbsBlockDevices = [{
    deviceName: "/dev/sdf",
    encrypted: true,
    volumeSize: 300,
    volumeType: "gp2",
}]

if (!config.workers.useInstanceStore) {
    workerEbsBlockDevices.push({
        deviceName: "/dev/sde",
        encrypted: true,
        volumeSize: 300,
        volumeType: "gp2",
    })
}

const workersLaunchConfig = new aws.ec2.LaunchConfiguration("workers", {
    ebsBlockDevices: workerEbsBlockDevices,
    ebsOptimized: true,
    iamInstanceProfile: iam.workerInstanceProfile,
    imageId: config.ami.worker[config.aws.region],
    instanceType: config.workers.instanceType,
    keyName: config.aws.keyPair,
    userData: pulumi.all([
        s3.configBucket.bucket,
        efs.datasets.id,
    ]).apply(([
        configBucketName,
        datasetsEfsId,
    ]) => {
        const template = handlebars.compile(fs.readFileSync("ec2-init-worker.sh", "utf8"))
        return template({
            configBucketName,
            datasetsEfsId,
        })
    }),
    securityGroups: [vpc.sgWorkers.id],
})

export const workersAsg = new aws.autoscaling.Group("workers", {
    name: pulumi.interpolate`${workersLaunchConfig.name}-asg`, // force a redeployment when launch configuration changes
    defaultCooldown: 120,
    enabledMetrics: ["GroupMinSize", "GroupMaxSize", "GroupDesiredCapacity", "GroupInServiceInstances", "GroupPendingInstances", "GroupStandbyInstances", "GroupTerminatingInstances", "GroupTotalInstances"],
    launchConfiguration: workersLaunchConfig,
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
    vpcZoneIdentifiers: vpc.vpc.privateSubnets.map((s) => s.subnet.id),
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
