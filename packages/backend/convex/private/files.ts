import { ConvexError, v } from "convex/values";
import { action } from "../_generated/server";
import 
{ 
    contentHashFromArrayBuffer,
    guessMimeTypeFromContents,
    guessMimeTypeFromExtension,
    RAG

 } from "@convex-dev/rag"   
import rag from "../system/ai/rag";      
import { extractText } from "@convex-dev/agent";
import { fi } from "zod/v4/locales";
import { extractTextContent } from "../lib/extractTextContent";

function guessMimeType(filename:string,bytes:ArrayBuffer):string{
    return(
        guessMimeTypeFromExtension(filename)||
        guessMimeTypeFromContents(bytes)||
        "application/octet-stream"
    );
};
export const addfile=action({
    args:{
        filename:v.string(),
        mimetype:v.string(),
        bytes:v.bytes(),
        category:v.optional(v.string())
    },
    handler:async(ctx,args)=>{
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
        throw new ConvexError({
        message: "Contact session is invalid or has expired",
        code: "unauthorized",
        });
        }
        const {bytes,filename,category}=args;
        const mimeType=args.mimetype || guessMimeType(filename,bytes) ;
        const blob=new Blob([bytes],{type:mimeType});
        const storageId=await ctx.storage.store(blob);
        const text=await extractTextContent(ctx,{
            storageId,
            filename,
            bytes,
            mimeType
        });

        
        const{}=await rag.add(ctx,{
            namespace: "",
            text,
            key:filename,
            title:filename,
            metadata:{
                storageId,
                uploadedBy:identity.userId ?? "",
                filename,
                category:category??null
            },
            contentHash:await contentHashFromArrayBuffer(bytes)
        })
    },
})