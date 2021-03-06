import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi"

import * as config from "../config"
import { Bucket } from "./bucket"

export const accessLogsBucket = new Bucket("access-logs", {
    customPolicy: true,
    extraArgs: {
        acl: "log-delivery-write",
        forceDestroy: true,
    },
})

const accountId = pulumi.output(aws.getCallerIdentity()).accountId

export const accessLogsBucketPolicy = new aws.s3.BucketPolicy("access-logs-bucket-policy", {
    bucket: accessLogsBucket.bucket,
    policy: {
        Version: "2012-10-17",
        Statement: [{
            Sid: "AllowSSLRequestsOnly",
            Effect: "Deny",
            Principal: "*",
            Action: "s3:*",
            Resource: [
                pulumi.interpolate`arn:aws:s3:::${accessLogsBucket.bucket}`,
                pulumi.interpolate`arn:aws:s3:::${accessLogsBucket.bucket}/*`,
            ],
            Condition: {
                Bool: {
                    "aws:SecureTransport": "false",
                },
            },
        }, {
            Effect: "Allow",
            Principal: {
                AWS: `arn:aws:iam::${config.elbAccountId[config.aws.region]}:root`,
            },
            Action: "s3:PutObject",
            Resource: pulumi.interpolate `arn:aws:s3:::${accessLogsBucket.bucket}/load-balacing/AWSLogs/${accountId}/*`,
        }, {
            Effect: "Allow",
            Principal: {
                Service: "delivery.logs.amazonaws.com",
            },
            Action: "s3:PutObject",
            Resource: pulumi.interpolate `arn:aws:s3:::${accessLogsBucket.bucket}/load-balacing/AWSLogs/${accountId}/*`,
            Condition: {
                StringEquals: {
                    "s3:x-amz-acl": "bucket-owner-full-control",
                },
            },
        }, {
            Effect: "Allow",
            Principal: {
                Service: "delivery.logs.amazonaws.com",
            },
            Action: "s3:GetBucketAcl",
            Resource: pulumi.interpolate `arn:aws:s3:::${accessLogsBucket.bucket}`,
        }],
    },
})

export const configBucket = new Bucket("config", { accessLogsBucket })

export const datasetsBucket = new Bucket("datasets", {
    accessLogsBucket,
    extraArgs: {
        versioning: {
            enabled: true,
        },
        lifecycleRules: [
            {
                enabled: true,
                id: "Move old versions to Glacier",
                noncurrentVersionTransitions: [
                    {
                        days: 30,
                        storageClass: "GLACIER",
                    },
                ],
                abortIncompleteMultipartUploadDays: 7,
            },
        ],
        forceDestroy: true,
    },
}, {
    protect: true,
})

export const inputFilesBucket = new Bucket("inputfiles", {
    accessLogsBucket,
    extraArgs: {
        versioning: {
            enabled: true,
        },
        lifecycleRules: [
            {
                enabled: true,
                id: "Move old versions to Glacier",
                noncurrentVersionTransitions: [
                    {
                        days: 30,
                        storageClass: "GLACIER",
                    },
                ],
                abortIncompleteMultipartUploadDays: 7,
            },
        ],
        forceDestroy: true,
    },
}, {
    protect: true,
})

export const licensesBucket = new Bucket("licenses", {
    accessLogsBucket,
    extraArgs: {
        forceDestroy: true,
    },
})

export const publicBucket = new Bucket("public", {
    accessLogsBucket,
    allowVpcRead: true,
    extraArgs: {
        forceDestroy: true,
    },
})

export const resultsBucket = new Bucket("results", {
    accessLogsBucket,
    extraArgs: {
        versioning: {
            enabled: true,
        },
        lifecycleRules: [
            {
                enabled: true,
                id: "Move old versions to Glacier",
                noncurrentVersionTransitions: [
                    {
                        days: 30,
                        storageClass: "GLACIER",
                    },
                ],
                abortIncompleteMultipartUploadDays: 7,
            },
        ],
        forceDestroy: true,
    },
}, {
    protect: true,
})

export const tempBucket = new Bucket("temp", {
    accessLogsBucket,
    extraArgs: {
        forceDestroy: true,
    },
})
