import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi"

import * as config from "./config"
import * as iam from "./iam"
import * as vpc from "./vpc"


export let searchDomain: aws.elasticsearch.Domain | undefined

if (config.services.aws.elasticsearch.enabled) {
    let elasticsearchConf = config.services.aws.elasticsearch

    searchDomain = new aws.elasticsearch.Domain("codeocean", {
        elasticsearchVersion: "6.8",
        encryptAtRest: { enabled: true },
        nodeToNodeEncryption: { enabled: true },
        vpcOptions: {
            securityGroupIds: [
                vpc.sgElasticsearch!.id,
            ],
            subnetIds: elasticsearchConf.multiAZ
                ? pulumi.output(vpc.vpc.privateSubnetIds).apply(v => v)
                : pulumi.output(vpc.vpc.privateSubnetIds).apply(v => [v[0]])
            ,
        },
        clusterConfig: {
            instanceCount: elasticsearchConf.multiAZ ? 2 : 1,
            instanceType: elasticsearchConf.instanceType,
            zoneAwarenessConfig: {
                availabilityZoneCount: elasticsearchConf.multiAZ ? 2 : undefined,
            },
            zoneAwarenessEnabled: elasticsearchConf.multiAZ,
        },
        domainEndpointOptions: {
            enforceHttps: true,
            tlsSecurityPolicy: "Policy-Min-TLS-1-2-2019-07",
        },
        ebsOptions: {
            ebsEnabled: true,
            volumeSize: 20,
        },
    })

    new aws.elasticsearch.DomainPolicy("policy" ,{
        domainName: searchDomain.domainName,
        accessPolicies: {
            Version: "2012-10-17",
            Statement: [{
                Effect: "Allow",
                Principal: {
                    AWS: [
                        iam.servicesInstanceRole.arn,
                    ],
                },
                Action: [
                    "es:ESHttpDelete",
                    "es:ESHttpGet",
                    "es:ESHttpHead",
                    "es:ESHttpPost",
                    "es:ESHttpPut",
                    "es:ESHttpPatch",
                ],
                Resource: pulumi.output(searchDomain.arn).apply(v => `${v}/*`),
            }],
        },
    })
}
