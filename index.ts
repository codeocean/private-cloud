import "./acm"
import "./backups"
import "./cloudwatch"
import "./dedicated-machines"
import "./efs"
import "./iam"
import "./route53"
import "./s3"
import "./s3/objects"
import "./sns"
import "./redis"

import * as asg from "./asg"
import * as ebs from "./ebs"
import * as ec2 from "./ec2"
import * as lb from "./lb"
import * as vpc from "./vpc"

// Stack outputs
export const albDnsName = lb.externalAlb.dnsName
export const ebsVolumeId = ebs.dataVolume.id
export const ec2ServicesInstanceId = ec2.servicesInstance.id
export const workersAsgId = asg.workersAsg.id
export const vpcId = vpc.vpc.id
