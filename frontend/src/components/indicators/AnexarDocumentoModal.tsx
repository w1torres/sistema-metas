import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Textarea } from '../common/Input';
import type { Attachment } from '../../types';
import { validateFile } from '../../utils/validators';
import { ACCEPTED_FILE_LABEL, ACCEPTED_FILE_TYPES } from '../../utils/constants';
import { formatFileSize } from '../../utils/formatters';

interface AnexarDocumentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnexar: (anexo: Attachment) => void;
  anexosExistentes?: Attachment[];
  onRemover?: (anexoId: string) => void;
}

export default function AnexarDocumentoModal({
  isOpen,
  onClose,
  onAnexar,
  anexosExistentes = [],
  onRemover,
}: AnexarDocumentoModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [descricao, setDescricao] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(f: File | null) {
    if (!f) {
      setFile(null);
      return;
    }
    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  }

  function handleClose() {
    setFile(null);
    setDescricao('');
    setError(null);
    onClose();
  }

  function handleSubmit() {
    if (!file) {
      setError('Selecione um arquivo para anexar.');
      return;
    }

    const anexo: Attachment = {
      id: `att-${crypto.randomUUID().slice(0, 8)}`,
      nome_arquivo: file.name,
      url: '#',
      tipo_mime: file.type,
      tamanho_bytes: file.size,
      descricao: descricao || undefined,
      criado_em: new Date().toISOString(),
    };

    onAnexar(anexo);
    toast.success('Arquivo anexado com sucesso!');
    handleClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Anexar Documento / Comprovação"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Anexar Arquivo</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFileChange(e.dataTransfer.files[0] ?? null);
          }}
        >
          <p className="text-sm text-secondary">Arraste um arquivo aqui ou clique para procurar</p>
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
            Selecionar Arquivo
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_FILE_TYPES.join(',')}
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-secondary">Tipos aceitos: {ACCEPTED_FILE_LABEL}</p>
          <p className="text-xs text-secondary">Tamanho máximo: 10 MB</p>
        </div>

        {file && (
          <p className="text-sm text-ink">
            📎 {file.name} <span className="text-secondary">({formatFileSize(file.size)})</span>
          </p>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <Textarea
          label="Descrição (opcional)"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          placeholder="Ex: Comprovante de conclusão da atividade..."
        />

        {anexosExistentes.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-medium text-secondary">Anexos anteriores</p>
            <ul className="flex flex-col gap-2">
              {anexosExistentes.map((anexo) => (
                <li key={anexo.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <span>
                    📎 {anexo.nome_arquivo} <span className="text-secondary">({formatFileSize(anexo.tamanho_bytes)})</span>
                  </span>
                  {onRemover && (
                    <button
                      type="button"
                      onClick={() => onRemover(anexo.id)}
                      className="text-xs font-medium text-danger hover:underline"
                    >
                      Remover
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
