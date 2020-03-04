import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi"
import * as acm from "./acm"
import * as config from "./config"
import * as ec2 from "./ec2"
import * as lb from "./lb"
import * as vpc from "./vpc"

const publicZone = new aws.route53.Zone("public", {
    comment: "Public name resolution",
    name: config.domains.app,
})

new aws.route53.Record("alb", {
    aliases: [{
        evaluateTargetHealth: false,
        name: pulumi.interpolate `dualstack.${lb.externalAlb.dnsName}`,
        zoneId: lb.externalAlb.zoneId,
    }],
    name: config.domains.app,
    type: aws.route53.RecordTypes.A,
    zoneId: publicZone.zoneId,
})

const sslCertValidation = new aws.route53.Record("ssl-cert-validation", {
    name: acm.sslCert.domainValidationOptions[0].resourceRecordName,
    records: [acm.sslCert.domainValidationOptions[0].resourceRecordValue],
    ttl: 300,
    type: acm.sslCert.domainValidationOptions[0].resourceRecordType,
    zoneId: publicZone.id,
})

new aws.acm.CertificateValidation("ssl-cert", {
    certificateArn: acm.sslCert.arn,
    validationRecordFqdns: [sslCertValidation.fqdn],
})

const registryZone = new aws.route53.Zone("registry", {
    comment: "Internal name resolution in VPC",
    name: config.services.registryHost,
    vpcs: [{
        vpcId: vpc.vpc.id,
        vpcRegion: config.aws.region,
    }],
})

new aws.route53.Record("registry", {
    aliases: [{
        evaluateTargetHealth: false,
        name: pulumi.interpolate `dualstack.${lb.internalAlb.dnsName}`,
        zoneId: lb.internalAlb.zoneId,
    }],
    name: config.services.registryHost,
    type: aws.route53.RecordTypes.A,
    zoneId: registryZone.zoneId,
})

const servicesZone = new aws.route53.Zone("services", {
    comment: "Internal service name resolution in VPC",
    name: "svc",
    vpcs: [{
        vpcId: vpc.vpc.id,
        vpcRegion: config.aws.region,
    }],
})

new aws.route53.Record("redis", {
    name: "redis.svc",
    records: [ ec2.servicesInstance.privateIp ],
    ttl: 60,
    type: aws.route53.RecordTypes.A,
    zoneId: servicesZone.zoneId,
})

new aws.route53.Record("wapi", {
    name: "wapi.svc",
    records: [ ec2.servicesInstance.privateIp ],
    ttl: 60,
    type: aws.route53.RecordTypes.A,
    zoneId: servicesZone.zoneId,
})
