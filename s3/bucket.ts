import * as fs from "fs"
import * as path from "path"

import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi"
import * as handlebars from "handlebars"
import * as mime from "mime"

import * as config from "../config"
import * as vpc from "../vpc"

export class Bucket extends aws.s3.Bucket {
    /**
     * The _unique_ name of the resource.
     */
    private name: string
    /**
     * The directory to upload files from.
     */
    private uploadDirectory: string

    /**
     * Create a private Bucket resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args Arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: BucketArgs, opts?: pulumi.CustomResourceOptions) {
        const bucketName = `codeocean-${config.stackname}-${name}`

        args = args || {}

        let bucketArgs = Object.assign<aws.s3.BucketArgs, aws.s3.BucketArgs>(args.extraArgs || {}, {
            serverSideEncryptionConfiguration: {
                rule: {
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: "AES256",
                    },
                },
            },
        })

        if (args.accessLogsBucket) {
            bucketArgs = Object.assign<aws.s3.BucketArgs, aws.s3.BucketArgs>({
                loggings: [{
                    targetBucket: args.accessLogsBucket.bucket,
                    targetPrefix: `s3/${bucketName}/`,
                }],
            }, bucketArgs)
        }

        super(bucketName, bucketArgs, opts)

        this.name = name
        this.uploadDirectory = path.join(__dirname, "buckets", name)

        let bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(`${name}-public-access`, {
            bucket: this.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        })

        if (args.customPolicy) {
            return
        }

        let statements: aws.iam.PolicyStatement[] = []
        statements.push({
            Sid: "AllowSSLRequestsOnly",
            Effect: "Deny",
            Principal: "*",
            Action: "s3:*",
            Resource: [
                pulumi.interpolate`arn:aws:s3:::${this.bucket}`,
                pulumi.interpolate`arn:aws:s3:::${this.bucket}/*`,
            ],
            Condition: {
                Bool: {
                    "aws:SecureTransport": "false",
                },
            },
        })

        if (args.allowVpcRead) {
            statements.push({
                Effect: "Allow",
                Principal: {
                    "AWS": "*",
                },
                Action: "s3:GetObject",
                Resource: pulumi.interpolate`arn:aws:s3:::${this.bucket}/*`,
                Condition: {
                    "StringEquals": {
                        "aws:sourceVpc": vpc.vpc.id,
                    },
                },
            })
        }
        if (args.allowVpcList) {
            statements.push({
                Effect: "Allow",
                Principal: {
                    "AWS": "*",
                },
                Action: "s3:ListBucket",
                Resource: pulumi.interpolate`arn:aws:s3:::${this.bucket}`,
                Condition: {
                    "StringEquals": {
                        "aws:sourceVpc": vpc.vpc.id,
                    },
                },
            })
        }

        new aws.s3.BucketPolicy(name, {
            bucket: this.bucket,
            policy: {
                Version: "2012-10-17",
                Statement: statements,
            },
        }, {
            dependsOn: bucketPublicAccessBlock,
        })
    }

    // walk recursively traverses the provided directory, applying the provided function
    // to every file it contains. Doesn't handle cycles from symlinks.
    private walk(dir: string, f: (_: string) => void) {
        const files = fs.readdirSync(dir)
        for (const file of files) {
            const filePath = `${dir}/${file}`
            const stat = fs.statSync(filePath)
            if (stat.isDirectory()) {
                this.walk(filePath, f)
            }
            if (stat.isFile()) {

                f(filePath)
            }
        }
    }

    // upload walks the provided directory tree and uploads found files to this S3 bucket
    public upload(args?: BucketUploadArgs) {
        args = args || {}

        this.walk(this.uploadDirectory, (filePath: string) => {
            const key = path.relative(this.uploadDirectory, filePath)

            let source: pulumi.asset.Asset
            if (args!.render) {
                const template = handlebars.compile(fs.readFileSync(filePath, "utf8"), {
                    noEscape: true,
                })
                source = pulumi.output(args!.context).apply(context => {
                    const asset = template(context)
                    return new pulumi.asset.StringAsset(asset)
                })
            } else {
                source = new pulumi.asset.FileAsset(filePath)
            }

            this.uploadObject({
                cacheControl: args!.cacheControl,
                contentType: mime.getType(filePath) || undefined,
                key,
                source,
            })
        })
    }

    // uploadObject uploads an object to the this S3 bucket
    public uploadObject(args: BucketObjectArgs) {
        new aws.s3.BucketObject(`${this.name}/${args.key}`, {
            bucket: this,
            cacheControl: args.cacheControl,
            contentType: args.contentType,
            key: args.key,
            source: args.source,
        })
    }
}

/**
 * The set of arguments for constructing a Bucket resource.
 */
export interface BucketArgs {
    /**
     * Bucket for access logs.
     */
    readonly accessLogsBucket?: aws.s3.Bucket
    /**
     * Allow list access to bucket from within VPC.
     */
    readonly allowVpcList?: boolean
    /**
     * Allow read access to bucket from within VPC.
     */
    readonly allowVpcRead?: boolean
    /**
     * Do not set bucket policies.
     */
    readonly customPolicy?: boolean
    /**
     * Extra arguments to use to populate `aws.s3.BucketArgs` resource's properties on top of the default ones.
     */
    readonly extraArgs?: aws.s3.BucketArgs
}

/**
 * The set of arguments for uploading bucket objects to S3.
 */
export interface BucketUploadArgs {
    /**
     * Specifies caching behavior along the request/reply chain Read [w3c cache_control](http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9) for further details.
     */
    readonly cacheControl?: pulumi.Input<string>
    /**
     * Context for rendering objects as templates.
     */
    readonly context?: pulumi.Input<any>
    /**
     * Render objects as templates.
     */
    readonly render?: boolean
}

/**
 * The set of arguments for constructing a BucketObject resource during upload to S3.
 */
export interface BucketObjectArgs {
    /**
     * Specifies caching behavior along the request/reply chain Read [w3c cache_control](http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9) for further details.
     */
    readonly cacheControl?: pulumi.Input<string>
    /**
     * A standard MIME type describing the format of the object data, e.g. application/octet-stream. All Valid MIME Types are valid for this input.
     */
    readonly contentType?: pulumi.Input<string>
    /**
     * The name of the object once it is in the bucket.
     */
    readonly key: pulumi.Input<string>
    /**
     * The path to a file that will be read and uploaded as raw bytes for the object content.
     */
    readonly source: pulumi.Input<pulumi.asset.Asset | pulumi.asset.Archive>
}
