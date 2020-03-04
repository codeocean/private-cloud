import * as aws from "@pulumi/aws"
import * as acm from "./acm"
import * as ec2 from "./ec2"
import * as s3 from "./s3"
import * as vpc from "./vpc"

// External ALB

export const externalAlb = new aws.elasticloadbalancingv2.LoadBalancer("external", {
    accessLogs: {
        bucket: s3.accessLogsBucket.bucket,
        enabled: true,
        prefix: "load-balacing"
    },
    enableHttp2: false,
    idleTimeout: 4000,
    securityGroups: [vpc.sgExternal.id],
    subnets: vpc.vpc.publicSubnetIds,
}, {
    dependsOn: s3.accessLogsBucketPolicy,
})

const webTargetGroup = new aws.elasticloadbalancingv2.TargetGroup("web", {
    healthCheck: {
        path: "/health",
    },
    port: 8001,
    protocol: "HTTP",
    vpcId: vpc.vpc.id,
})

const gwTargetGroup = new aws.elasticloadbalancingv2.TargetGroup("gw", {
    healthCheck: {
        path: "/api/health",
    },
    port: 8080,
    protocol: "HTTP",
    vpcId: vpc.vpc.id,
})

const fileProxyTargetGroup = new aws.elasticloadbalancingv2.TargetGroup("file-proxy", {
    healthCheck: {
        path: "/health",
    },
    port: 8504,
    protocol: "HTTP",
    vpcId: vpc.vpc.id,
})

const cwProxyTargetGroup = new aws.elasticloadbalancingv2.TargetGroup("cw-proxy", {
    healthCheck: {
        path: "/health",
    },
    port: 8114,
    protocol: "HTTP",
    vpcId: vpc.vpc.id,
})

const gitProxyTargetGroup = new aws.elasticloadbalancingv2.TargetGroup("git-proxy", {
    healthCheck: {
        path: "/health",
    },
    port: 3050,
    protocol: "HTTP",
    vpcId: vpc.vpc.id,
})

const s3ProxyTargetGroup = new aws.elasticloadbalancingv2.TargetGroup("s3-proxy", {
    healthCheck: {
        path: "/health",
    },
    port: 8505,
    protocol: "HTTP",
    vpcId: vpc.vpc.id,
})

new aws.elasticloadbalancingv2.Listener("external-http", {
    defaultActions: [{
        redirect: {
            port: "443",
            protocol: "HTTPS",
            statusCode: "HTTP_301",
        },
        type: "redirect",
    }],
    loadBalancerArn: externalAlb.arn,
    port: 80,
    protocol: "HTTP",
})

const listener = new aws.elasticloadbalancingv2.Listener("external-https", {
    certificateArn: acm.sslCert.arn,
    defaultActions: [{
        type: "forward",
        targetGroupArn: webTargetGroup.arn,
    }],
    loadBalancerArn: externalAlb.arn,
    port: 443,
    protocol: "HTTPS",
    sslPolicy: "ELBSecurityPolicy-TLS-1-2-2017-01",
})

let priority = 1

new aws.elasticloadbalancingv2.ListenerRule("file-proxy", {
    actions: [{
        type: "forward",
        targetGroupArn: fileProxyTargetGroup.arn,
    }],
    conditions: [{
        pathPattern: {
            values: ["/files/*"],
        },
    }],
    listenerArn: listener.arn,
    priority: priority++,
}, {
    deleteBeforeReplace: true,
})

new aws.elasticloadbalancingv2.ListenerRule("file-proxy-auth-callback", {
    actions: [{
        type: "forward",
        targetGroupArn: fileProxyTargetGroup.arn,
    }],
    conditions: [{
        pathPattern: {
            values: ["/files_auth_callback"],
        },
    }],
    listenerArn: listener.arn,
    priority: priority++,
}, {
    deleteBeforeReplace: true,
})

new aws.elasticloadbalancingv2.ListenerRule("git-proxy", {
    actions: [{
        type: "forward",
        targetGroupArn: gitProxyTargetGroup.arn,
    }],
    conditions: [{
        pathPattern: {
            values: ["/capsule-*.git/*"],
        },
    }],
    listenerArn: listener.arn,
    priority: priority++,
}, {
    deleteBeforeReplace: true,
})

new aws.elasticloadbalancingv2.ListenerRule("cw-proxy", {
    actions: [{
        type: "forward",
        targetGroupArn: cwProxyTargetGroup.arn,
    }],
    conditions: [{
        pathPattern: {
            values: ["/cw/*"],
        },
    }],
    listenerArn: listener.arn,
    priority: priority++,
}, {
    deleteBeforeReplace: true,
})

new aws.elasticloadbalancingv2.ListenerRule("gw", {
    actions: [{
        type: "forward",
        targetGroupArn: gwTargetGroup.arn,
    }],
    conditions: [{
        pathPattern: {
            values: ["/api/*"],
        },
    }],
    listenerArn: listener.arn,
    priority: priority++,
}, {
    deleteBeforeReplace: true,
})

new aws.elasticloadbalancingv2.ListenerRule("s3-proxy", {
    actions: [{
        type: "forward",
        targetGroupArn: s3ProxyTargetGroup.arn,
    }],
    conditions: [{
        pathPattern: {
            values: ["/s3/*"],
        },
    }],
    listenerArn: listener.arn,
    priority: priority++,
}, {
    deleteBeforeReplace: true,
})

new aws.elasticloadbalancingv2.TargetGroupAttachment("s3-proxy", {
    targetId: ec2.servicesInstance.id,
    targetGroupArn: s3ProxyTargetGroup.arn,
})

new aws.elasticloadbalancingv2.TargetGroupAttachment("git-proxy", {
    targetId: ec2.servicesInstance.id,
    targetGroupArn: gitProxyTargetGroup.arn,
})

new aws.elasticloadbalancingv2.TargetGroupAttachment("cw-proxy", {
    targetId: ec2.servicesInstance.id,
    targetGroupArn: cwProxyTargetGroup.arn,
})

new aws.elasticloadbalancingv2.TargetGroupAttachment("file-proxy", {
    targetId: ec2.servicesInstance.id,
    targetGroupArn: fileProxyTargetGroup.arn,
})

new aws.elasticloadbalancingv2.TargetGroupAttachment("gw", {
    targetId: ec2.servicesInstance.id,
    targetGroupArn: gwTargetGroup.arn,
})

new aws.elasticloadbalancingv2.TargetGroupAttachment("web", {
    targetId: ec2.servicesInstance.id,
    targetGroupArn: webTargetGroup.arn,
})

// Internal ALB

export const internalAlb = new aws.elasticloadbalancingv2.LoadBalancer("services", {
    accessLogs: {
        bucket: s3.accessLogsBucket.bucket,
        enabled: true,
        prefix: "load-balacing"
    },
    internal: true,
    subnets: vpc.vpc.privateSubnetIds,
    securityGroups: [vpc.sgServices.id],
}, {
    dependsOn: s3.accessLogsBucketPolicy,
})

const registryTargetGroup = new aws.elasticloadbalancingv2.TargetGroup("registry", {
    healthCheck: {
        path: "/",
    },
    port: 5000,
    protocol: "HTTP",
    vpcId: vpc.vpc.id,
})

new aws.elasticloadbalancingv2.Listener("internal-https", {
    certificateArn: acm.sslCert.arn,
    defaultActions: [{
        type: "forward",
        targetGroupArn: registryTargetGroup.arn,
    }],
    loadBalancerArn: internalAlb.arn,
    port: 443,
    protocol: "HTTPS",
    sslPolicy: "ELBSecurityPolicy-TLS-1-2-2017-01",
}, {
    deleteBeforeReplace: true,
})

new aws.elasticloadbalancingv2.TargetGroupAttachment("registry", {
    targetId: ec2.servicesInstance.id,
    targetGroupArn: registryTargetGroup.arn,
})
