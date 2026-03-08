import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Preview = () => {
  const [searchParams] = useSearchParams();
  const websiteId = searchParams.get("id");
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [js, setJs] = useState("");
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!websiteId) return;

    const fetchWebsite = async () => {
      const { data } = await supabase
        .from("websites")
        .select("name, generated_html, generated_css, generated_js")
        .eq("id", websiteId)
        .single();

      if (data) {
        setHtml(data.generated_html || "");
        setCss(data.generated_css || "");
        setJs(data.generated_js || "");
        setName(data.name || "");
      }
      setLoading(false);
    };

    fetchWebsite();
  }, [websiteId]);

  const iframeSrc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${css}</style>
</head>
<body>
${html}
<script>${js}<\/script>
</body>
</html>`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-pulse text-muted-foreground">Loading preview...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <div className="bg-card border-b px-4 py-3 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </Button>
        <span className="font-semibold">{name}</span>
      </div>
      <div className="flex-1">
        <iframe
          srcDoc={iframeSrc}
          className="w-full h-full border-0"
          style={{ minHeight: "calc(100vh - 56px)" }}
          title={`Preview of ${name}`}
          sandbox="allow-scripts"
        />
      </div>
    </div>
  );
};

export default Preview;
