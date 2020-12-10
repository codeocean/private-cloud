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

// General Workers

const workerEbsBlockDevices: aws.types.input.ec2.LaunchTemplateBlockDeviceMapping[] = [{
    deviceName: "/dev/xvda",
    ebs: {
        encrypted: "true",
        volumeSize: 8,
    }
},{
    deviceName: "/dev/sdf",
    ebs: {
        encrypted: "true",
        volumeSize: 300,
        volumeType: "gp2",
    },
}]

if (!config.workers.general.useInstanceStore) {
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
    instanceType: config.workers.general.instanceType,
    keyName: config.aws.keyPair,
    metadataOptions: {
        httpEndpoint: "enabled",
        httpPutResponseHopLimit: 2,
        httpTokens: "required",
    },
    userData: pulumi.all([
        s3.configBucket.bucket,
        efs.capsuleCache?.id,
        efs.datasets.id,
        config.stackname,
        config.workers.general.useInstanceStore,
    ]).apply(([
        configBucketName,
        capsuleCacheEfsId,
        datasetsEfsId,
        pulumiStackName,
        useInstanceStore,
    ]) => {
        const machineType = 0
        const template = handlebars.compile(fs.readFileSync("ec2-init-worker.sh", "utf8"))
        return Buffer.from(template({
            configBucketName,
            capsuleCacheEfsId,
            datasetsEfsId,
            pulumiStackName,
            machineType,
            useInstanceStore,
        })).toString("base64")
    }),
    vpcSecurityGroupIds: [vpc.sgWorkers.id],
})

export const workersAsg = new aws.autoscaling.Group("workers", {
    name: pulumi.interpolate`${workersLaunchTemplate.name}-${workersLaunchTemplate.latestVersion}-asg`, // force a redeployment when launch template changes
    defaultCooldown: 60,
    enabledMetrics: ["GroupMinSize", "GroupMaxSize", "GroupDesiredCapacity", "GroupInServiceInstances", "GroupPendingInstances", "GroupStandbyInstances", "GroupTerminatingInstances", "GroupTotalInstances"],
    launchTemplate: {
        id: workersLaunchTemplate.id,
        version: pulumi.interpolate`${workersLaunchTemplate.latestVersion}`,
    },
    maxSize: config.workers.general.autoScalingMaxSize,
    minSize: config.workers.general.autoScalingMinSize,
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
    waitForCapacityTimeout: "0",
})

export const workersAvailableSlotsScaleOutPolicy = new aws.autoscaling.Policy("workers-available-slots-scale-out", {
    adjustmentType: "ChangeInCapacity",
    autoscalingGroupName: workersAsg.name,
    estimatedInstanceWarmup: 120,
    policyType: "StepScaling",
    stepAdjustments: [{
        metricIntervalUpperBound: "0",
        scalingAdjustment: 1,
    }],
})

export const workersAvailableSlotsScaleInPolicy = new aws.autoscaling.Policy("workers-available-slots-scale-in", {
    adjustmentType: "ChangeInCapacity",
    autoscalingGroupName: workersAsg.name,
    policyType: "StepScaling",
    stepAdjustments: [{
        metricIntervalLowerBound: "0",
        scalingAdjustment: -1,
    }],
})

// Gpu Workers

const workerGpuEbsBlockDevices: aws.types.input.ec2.LaunchTemplateBlockDeviceMapping[] = [{
    deviceName: "/dev/xvda",
    ebs: {
        encrypted: "true",
        volumeSize: 8,
    },
},{
    deviceName: "/dev/sdf",
    ebs: {
        encrypted: "true",
        volumeSize: 300,
        volumeType: "gp2",
    },
}]

if (!config.workers.gpu.useInstanceStore) {
    workerGpuEbsBlockDevices.push({
        deviceName: "/dev/sde",
        ebs: {
            encrypted: "true",
            volumeSize: 300,
            volumeType: "gp2",
        },
    })
}

const workersGpuLaunchTemplate = new aws.ec2.LaunchTemplate("workers-gpu", {
    blockDeviceMappings: workerGpuEbsBlockDevices,
    ebsOptimized: "true",
    iamInstanceProfile: {
        arn: iam.workerInstanceProfile.arn,
    },
    imageId: config.ami.worker[config.aws.region],
    instanceType: config.workers.gpu.instanceType,
    keyName: config.aws.keyPair,
    metadataOptions: {
        httpEndpoint: "enabled",
        httpPutResponseHopLimit: 2,
        httpTokens: "required",
    },
    userData: pulumi.all([
        s3.configBucket.bucket,
        efs.capsuleCache?.id,
        efs.datasets.id,
        config.stackname,
        config.workers.gpu.useInstanceStore,
    ]).apply(([
        configBucketName,
        capsuleCacheEfsId,
        datasetsEfsId,
        pulumiStackName,
        useInstanceStore,
    ]) => {
        const machineType = 1
        const template = handlebars.compile(fs.readFileSync("ec2-init-worker.sh", "utf8"))
        return Buffer.from(template({
            configBucketName,
            capsuleCacheEfsId,
            datasetsEfsId,
            pulumiStackName,
            machineType,
            useInstanceStore,
        })).toString("base64")
    }),
    vpcSecurityGroupIds: [vpc.sgWorkers.id],
})

export const workersGpuAsg = new aws.autoscaling.Group("workers-gpu", {
    name: pulumi.interpolate`${workersGpuLaunchTemplate.name}-${workersGpuLaunchTemplate.latestVersion}-asg`, // force a redeployment when launch template changes
    defaultCooldown: 60,
    enabledMetrics: ["GroupMinSize", "GroupMaxSize", "GroupDesiredCapacity", "GroupInServiceInstances", "GroupPendingInstances", "GroupStandbyInstances", "GroupTerminatingInstances", "GroupTotalInstances"],
    launchTemplate: {
        id: workersGpuLaunchTemplate.id,
        version: pulumi.interpolate`${workersGpuLaunchTemplate.latestVersion}`,
    },
    maxSize: config.workers.gpu.autoScalingMaxSize,
    minSize: config.workers.gpu.autoScalingMinSize,
    tags: [{
        key: "Name",
        propagateAtLaunch: true,
        value: "codeocean-worker-gpu",
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
    waitForCapacityTimeout: "0",
})

export const workersGpuAvailableSlotsScaleOutPolicy = new aws.autoscaling.Policy("workers-gpu-available-slots-scale-out", {
    adjustmentType: "ChangeInCapacity",
    autoscalingGroupName: workersGpuAsg.name,
    estimatedInstanceWarmup: 120,
    policyType: "StepScaling",
    stepAdjustments: [{
        metricIntervalUpperBound: "0",
        scalingAdjustment: 1,
    }],
})

export const workersGpuAvailableSlotsScaleInPolicy = new aws.autoscaling.Policy("workers-gpu-available-slots-scale-in", {
    adjustmentType: "ChangeInCapacity",
    autoscalingGroupName: workersGpuAsg.name,
    policyType: "StepScaling",
    stepAdjustments: [{
        metricIntervalLowerBound: "0",
        scalingAdjustment: -1,
    }],
})
