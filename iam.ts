import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi"
import * as s3 from "./s3"

// Services

export const servicesInstanceRole = new aws.iam.Role("ServicesInstanceRole", {
    description: "Allows EC2 services instance to call AWS services.",
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal(aws.iam.Ec2Principal),
})

export const servicesInstanceProfile = new aws.iam.InstanceProfile("ServicesInstanceProfile", {
    role: servicesInstanceRole,
})

new aws.iam.RolePolicyAttachment("servicesinstancerole-ssm-policy", {
     policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
     role: servicesInstanceRole.name,
})

const servicesInstanceS3AccessPolicy = new aws.iam.Policy("ServicesInstanceS3Access", {
    description: "S3 permissions for EC2 services instance",
    policy: {
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Action: "s3:GetObject",
            Resource: [
                s3BucketObjectsArn(s3.assetsBucket),
                s3BucketObjectsArn(s3.configBucket),
                s3BucketObjectsArn(s3.resultsBucket),
                s3BucketObjectsArn(s3.tempBucket),
                s3BucketObjectsArn(s3.templatesBucket),
            ]
        }, {
            Effect: "Allow",
            Action: "s3:ListBucket",
            Resource: [
                s3.configBucket.arn,
                s3.resultsBucket.arn,
                s3.tempBucket.arn,
                s3.templatesBucket.arn,
            ]
        }, {
            Effect: "Allow",
            Action: [
                "s3:PutObject",
                "s3:DeleteObject",
            ],
            Resource: [
                s3BucketObjectsArn(s3.publicBucket),
                s3BucketObjectsArn(s3.resultsBucket),
                s3BucketObjectsArn(s3.tempBucket),
            ]
        }]
    },
})

new aws.iam.RolePolicyAttachment("servicesinstancerole-s3-policy", {
     policyArn: servicesInstanceS3AccessPolicy.arn,
     role: servicesInstanceRole.name,
})

// Workers

export const workerInstanceRole = new aws.iam.Role("WorkerInstanceRole", {
    description: "Allows EC2 worker instance to call AWS services.",
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal(aws.iam.Ec2Principal),
})

export const workerInstanceProfile = new aws.iam.InstanceProfile("WorkerInstanceProfile", {
    role: workerInstanceRole,
})

new aws.iam.RolePolicyAttachment("workerinstancerole-ssm-policy", {
     policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
     role: workerInstanceRole.name,
})

const workerInstanceS3AccessPolicy = new aws.iam.Policy("WorkerInstanceS3Access", {
    description: "S3 permissions for EC2 worker instance",
    policy: {
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Action: "s3:GetObject",
            Resource: [
                s3BucketObjectsArn(s3.licensesBucket),
                s3BucketObjectsArn(s3.configBucket),
                s3BucketObjectsArn(s3.resultsBucket),
            ]
        }, {
            Effect: "Allow",
            Action: "s3:ListBucket",
            Resource: [
                s3.configBucket.arn,
                s3.licensesBucket.arn,
            ]
        }, {
            Effect: "Allow",
            Action: [
                "s3:PutObject",
                "s3:DeleteObject",
            ],
            Resource: [
                s3BucketObjectsArn(s3.resultsBucket),
            ]
        }]
    },
})

new aws.iam.RolePolicyAttachment("workerinstancerole-s3-policy", {
     policyArn: workerInstanceS3AccessPolicy.arn,
     role: workerInstanceRole.name,
})

const workerInstanceAutoScalingAccessPolicy = new aws.iam.Policy("WorkerInstanceAutoScalingAccess", {
    description: "Auto Scale Group permissions for EC2 worker instance",
    policy: {
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Action: [
                "autoscaling:DescribeAutoScalingGroups",
                "autoscaling:DescribeAutoScalingInstances",
                "autoscaling:SetInstanceProtection",
            ],
            Resource: "*",
        }],
    },
})

new aws.iam.RolePolicyAttachment("workerinstancerole-autoscaling-policy", {
     policyArn: workerInstanceAutoScalingAccessPolicy.arn,
     role: workerInstanceRole.name,
})

const workerInstanceCloudWatchAccessPolicy = new aws.iam.Policy("WorkerInstanceCloudWatchAccess", {
    description: "CloudWatch permissions for EC2 worker instance",
    policy: {
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Action: [
                "cloudwatch:PutMetricData"
            ],
            Resource: "*",
        }],
    },
})

new aws.iam.RolePolicyAttachment("workerinstancerole-cloudwatch-policy", {
     policyArn: workerInstanceCloudWatchAccessPolicy.arn,
     role: workerInstanceRole.name,
})

// Helpers

function s3BucketObjectsArn(bucket: aws.s3.Bucket): pulumi.Output<string> {
    return pulumi.interpolate `${bucket.arn}/*`
}
