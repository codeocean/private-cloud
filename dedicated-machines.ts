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

const dedicatedWorkerImage = config.ami.worker[config.aws.region]

const { accountId } = aws.getCallerIdentity()

export const launchTemplate = new aws.ec2.LaunchTemplate("dedicated-worker", {
    tags: {
        deployment: "codeocean-private-cloud",
    },
    imageId: dedicatedWorkerImage,
    instanceType: config.workers.instanceType,
    keyName: config.aws.keyPair,
    blockDeviceMappings: [{
        deviceName: "/dev/sdf",
        ebs: {
            volumeType: "gp2",
            volumeSize: 300,
            encrypted: "true",
            deleteOnTermination: "true",
        },
    }, {
        deviceName: "/dev/sdg",
        ebs: {
            volumeType: "gp2",
            volumeSize: 300,
            encrypted: "true",
            deleteOnTermination: "true",
        },
    }],
    tagSpecifications: [{
        resourceType: "instance",
        tags: {
            Name: "codeocean-dedicated-worker",
            deployment: "codeocean-private-cloud",
            role: "dedicated-worker",
        },
    }, {
        resourceType: "volume",
        tags: {
            Name: "codeocean-dedicated-worker",
            deployment: config.deploymentName,
            role: "dedicated-worker",
        },
    }],
    networkInterfaces: [{
        subnetId: vpc.vpc.privateSubnetIds[0],
        securityGroups: [vpc.sgWorkers.id],
        deleteOnTermination: true,
    }],
    iamInstanceProfile: {
        arn: iam.workerInstanceProfile.arn,
    },
    userData: pulumi.all([
        s3.configBucket.bucket,
        efs.datasets.id,
    ]).apply(([
        configBucketName,
        datasetsEfsId,
    ]) => {
        const template = handlebars.compile(fs.readFileSync("ec2-init-dedicated-worker.sh", "utf8"))
        return Buffer.from(template({
            configBucketName,
            datasetsEfsId,
        })).toString("base64")
    }),
})

const policy = new aws.iam.Policy("DedicatedMachines", {
    description: "Policy for managing dedicated machines",
    policy: {
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Action: [
                "ec2:DescribeInstances",
                "ec2:DescribeInstanceTypes",
            ],
            Resource: "*",
        }, {
            Effect: "Allow",
            Action: "iam:PassRole",
            Resource: iam.workerInstanceRole.arn,
        }, {
            Effect: "Allow",
            Action: "ec2:RunInstances",
            Resource: [
                // `arn:aws:ec2:${config.aws.region}::image/${config.ami.worker[config.aws.region]}`,
                `arn:aws:ec2:${config.aws.region}::image/${dedicatedWorkerImage}`,
                `arn:aws:ec2:${config.aws.region}:${accountId}:instance/*`,
                `arn:aws:ec2:${config.aws.region}:${accountId}:key-pair/${config.aws.keyPair}`,
                launchTemplate.arn,
                `arn:aws:ec2:${config.aws.region}:${accountId}:network-interface/*`,
                vpc.sgWorkers.arn,
                ...vpc.vpc.privateSubnets.map((subnet) => subnet.subnet.arn),
                `arn:aws:ec2:${config.aws.region}:${accountId}:volume/*`,
            ],
        }, {
            Effect: "Allow",
            Action: "ec2:CreateTags",
            Resource: [
                `arn:aws:ec2:${config.aws.region}:${accountId}:instance/*`,
                `arn:aws:ec2:${config.aws.region}:${accountId}:volume/*`,
            ],
            Condition: {
                StringEquals: {
                    "ec2:CreateAction": "RunInstances",
                },
                "ForAllValues:StringEquals": {
                    "aws:TagKeys": [
                        "Name",
                        "deployment",
                        "role",
                        "codeocean.com/user",
                        "codeocean.com/capsule",
                    ],
                },
            },
        }, {
            Effect: "Allow",
            Action: "ec2:TerminateInstances",
            Resource: `arn:aws:ec2:${config.aws.region}:${accountId}:instance/*`,
            Condition: {
                StringEquals: {
                    "ec2:ResourceTag/deployment": "codeocean-private-cloud",
                    "ec2:ResourceTag/role": "dedicated-worker",
                },
            },
        }],
    },
})

new aws.iam.RolePolicyAttachment("servicesinstancerole-dedicated-machines-policy", {
    policyArn: policy.arn,
    role: iam.servicesInstanceRole.name,
})
