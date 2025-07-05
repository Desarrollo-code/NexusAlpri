import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Download, Eye } from "lucide-react";
import { resources } from "@/lib/data";
import { cookies } from "next/headers";

export default function ResourcesPage() {
    const cookieStore = cookies();
    const role = cookieStore.get('user_role')?.value;
    const canDownload = role === 'administrator' || role === 'instructor';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline">Biblioteca de Recursos</h1>
          <p className="text-muted-foreground">Documentos, guías, manuales y políticas de la empresa.</p>
        </div>
        {canDownload && (
            <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Recurso
            </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Input placeholder="Buscar recursos..." className="flex-1" />
        <Select>
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="politicas">Políticas</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="ventas">Ventas</SelectItem>
            </SelectContent>
        </Select>
        <Select>
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tipo de archivo" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="pptx">PPTX</SelectItem>
                <SelectItem value="docx">DOCX</SelectItem>
            </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {resources.map(resource => (
          <Card key={resource.id}>
            <CardHeader className="p-0">
              <Image 
                src={resource.thumbnail} 
                alt={resource.title} 
                width={400} 
                height={300} 
                className="rounded-t-lg object-cover aspect-[4/3]" 
                data-ai-hint={resource.hint}
              />
            </CardHeader>
            <CardContent className="pt-4">
              <CardTitle className="font-headline text-lg">{resource.title}</CardTitle>
            </CardContent>
            <CardFooter className="flex gap-2">
                <Button variant="outline" className="w-full">
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar
                </Button>
                {canDownload ? (
                    <Button className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Descargar
                    </Button>
                ) : (
                    <Button className="w-full" disabled>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar
                    </Button>
                )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
