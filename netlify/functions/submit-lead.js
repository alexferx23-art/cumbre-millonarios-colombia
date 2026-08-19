// Recibe los datos del cuestionario de la landing y crea automaticamente
// una tarjeta en el CRM de Notion (base "CRM de Ventas"), columna
// "Cuestionario Completado". El token de Notion vive protegido como
// variable de entorno en Netlify -- nunca se expone en el codigo publico.

const NOTION_DATABASE_ID = "e46b1219ed3e461696bedb39410035c3";

exports.handler = async function (event) {
    if (event.httpMethod !== "POST") {
          return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
          const params = new URLSearchParams(event.body);
          const data = Object.fromEntries(params.entries());

      const notionToken = process.env.NOTION_TOKEN;
          if (!notionToken) {
                  console.error("Falta la variable de entorno NOTION_TOKEN en Netlify.");
                  return { statusCode: 500, body: "Missing Notion token" };
          }

      const notas = [
              "Correo: " + (data.correo || ""),
              "Entrada: " + (data.entrada || ""),
              "Calificado: " + (data.calificado || ""),
              "",
              "Q1: " + (data.q1_brecha || ""),
              "Q2: " + (data.q2_disposicion || ""),
              "Q3: " + (data.q3_disponibilidad_economica || ""),
              "Q4: " + (data.q4_motivacion || ""),
              "Q5: " + (data.q5_expectativa || ""),
              "Q6: " + (data.q6_objetivo || "")
            ].join("\n").slice(0, 2000);

      const notionRes = await fetch("https://api.notion.com/v1/pages", {
              method: "POST",
              headers: {
                        Authorization: "Bearer " + notionToken,
                        "Notion-Version": "2022-06-28",
                        "Content-Type": "application/json"
              },
              body: JSON.stringify({
                        parent: { database_id: NOTION_DATABASE_ID },
                        properties: {
                                    "Nombre del Prospecto": {
                                                  title: [{ text: { content: data.nombre || "Sin nombre" } }]
                                    },
                                    "Telefono / WhatsApp": {
                                                  phone_number: data.whatsapp || null
                                    },
                                    "Nicho / Tipo": {
                                                  select: { name: "Desarrollo Personal" }
                                    },
                                    Estado: {
                                                  select: { name: "Cuestionario Completado" }
                                    },
                                    "Notas / Objeciones": {
                                                  rich_text: [{ text: { content: notas } }]
                                    }
                        }
              })
      });

      if (!notionRes.ok) {
              const errText = await notionRes.text();
              console.error("Notion API error:", notionRes.status, errText);
              return { statusCode: 502, body: "Notion error: " + errText };
      }

      return {
              statusCode: 200,
              body: JSON.stringify({ success: true })
      };
    } catch (err) {
          console.error("submit-lead error:", err);
          return { statusCode: 500, body: "Server error" };
    }
};
