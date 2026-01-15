-- Add drive_link column to projetos table
ALTER TABLE projetos
ADD COLUMN drive_link TEXT;

-- Add comment to document the column
COMMENT ON COLUMN projetos.drive_link IS 'Link para a pasta do Google Drive contendo documentos do projeto';
